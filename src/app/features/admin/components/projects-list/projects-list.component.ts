import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth/auth-service';
import { ProjectsStoreService } from '../../../../core/services/projects/projects-store.service';
import { ProjectInterface } from '../../../../core/intefaces/form/project.interface';
import { ProjectSizeEnum } from '../../../../core/enums/project-size.enum';
import { ProjectSortOption, sortProjects } from '../../../../core/utils/project-sort.util';
import { ProjectGroup, groupProjects } from '../../../../core/utils/project-group.util';
import { ButtonComponent } from '../../../../shared/compoments/button/button';
import { ProjectCardComponent } from '../../../../shared/compoments/project-card/project-card.component';
import { ProjectFilterBarComponent } from '../../../../shared/compoments/project-filter-bar/project-filter-bar.component';
import { SupplierPickerComponent } from '../../../../shared/compoments/supplier-picker/supplier-picker.component';

@Component({
  selector: 'app-projects-list',
  imports: [ButtonComponent, RouterLink, ProjectCardComponent, ProjectFilterBarComponent, SupplierPickerComponent],
  templateUrl: './projects-list.component.html',
  styleUrl: './projects-list.component.less',
})
export class ProjectsListComponent {
  private authService = inject(AuthService);
  private projectsStore = inject(ProjectsStoreService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Pre-filled when arriving from the Employees list via "View projects".
  searchQuery = signal(this.route.snapshot.queryParamMap.get('q') ?? '');
  sizeFilter = signal<ProjectSizeEnum | null>(null);
  erpFilter = signal('');
  sortBy = signal<ProjectSortOption>('name');

  // Every employee a project can be assigned to, keyed by username for the "assigned to" chip.
  private readonly assignableUsers = this.authService.getAssignableUsers();

  // Sheet load progress — drives the loading / retry states in the template.
  readonly projectsLoading = this.projectsStore.loading;
  readonly projectsLoadError = this.projectsStore.loadError;

  // Every ERP that appears across all projects, for the ERP filter dropdown.
  readonly availableErps = computed(() => {
    const erps = this.projectsStore
      .all()
      .map((p) => p.erp)
      .filter((erp): erp is string => !!erp);
    return Array.from(new Set(erps)).sort();
  });

  readonly hasActiveFilters = computed(
    () => !!this.searchQuery() || !!this.sizeFilter() || !!this.erpFilter(),
  );

  readonly filteredProjects = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const size = this.sizeFilter();
    const erp = this.erpFilter();

    let result = this.projectsStore.all();

    if (query) {
      result = result.filter(
        (p) =>
          p.projectName.toLowerCase().includes(query) ||
          (p.erp && p.erp.toLowerCase().includes(query)) ||
          p.supplier.toLowerCase().includes(query) ||
          this.assignedToName(p).toLowerCase().includes(query),
      );
    }
    if (size) {
      result = result.filter((p) => p.tentativeProjectSize === size);
    }
    if (erp) {
      result = result.filter((p) => p.erp === erp);
    }

    return sortProjects(result, this.sortBy());
  });

  // One card per project — each group holds that project's supplier entries.
  readonly filteredGroups = computed(() => groupProjects(this.filteredProjects()));

  // The group whose suppliers are being chosen from (null = dialog closed).
  pickerGroup = signal<ProjectGroup | null>(null);

  readonly username = computed(() => this.authService.getCurrentUser()?.username ?? '');

  assignedToName(project: ProjectInterface): string {
    const match = this.assignableUsers.find((u) => u.username === project.user);
    return match ? (match.fullName || match.username) : project.user;
  }

  // Group chip: the shared owner's name, or "Multiple" when suppliers differ.
  assignedToNameForGroup(group: ProjectGroup): string {
    const names = new Set(group.entries.map((e) => this.assignedToName(e)));
    return names.size === 1 ? this.assignedToName(group.entries[0]) : 'Multiple';
  }

  toggleSizeFilter(size: ProjectSizeEnum): void {
    this.sizeFilter.set(this.sizeFilter() === size ? null : size);
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.sizeFilter.set(null);
    this.erpFilter.set('');
  }

  retryLoad(): void {
    this.projectsStore.load();
  }

  addProject(): void {
    this.router.navigateByUrl('/admin/projects/new');
  }

  // One supplier goes straight to the form; several open the picker dialog.
  editGroup(group: ProjectGroup): void {
    if (group.entries.length === 1) {
      this.editEntry(group.entries[0]);
    } else {
      this.pickerGroup.set(group);
    }
  }

  editEntry(entry: ProjectInterface): void {
    this.pickerGroup.set(null);
    //* Pass the already-loaded entry via router state so the edit form can use it
    //* directly instead of re-fetching the same data. The supplier tells the
    //* form which row of the project to edit.
    this.router.navigate(['/admin/projects', encodeURIComponent(entry.projectName), 'edit'], {
      queryParams: { supplier: entry.supplier },
      state: { project: entry },
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/login');
  }
}
