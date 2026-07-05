import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
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

/*
 * ──────────────────────────────────────────────────────────────────
 !  Landing page for the User role
 *
 *  Shows only the projects currently assigned to the signed-in
 *  employee. A project reassigned away from them by an admin
 *  disappears from this list on the next read of the store.
 * ──────────────────────────────────────────────────────────────────
 */
@Component({
  selector: 'app-project-list',
  imports: [ButtonComponent, ProjectCardComponent, ProjectFilterBarComponent, SupplierPickerComponent],
  templateUrl: './project-list.component.html',
  styleUrl: './project-list.component.less',
})
export class ProjectListComponent {
  private authService = inject(AuthService);
  private projectsStore = inject(ProjectsStoreService);
  private router = inject(Router);

  searchQuery = signal('');
  sizeFilter = signal<ProjectSizeEnum | null>(null);
  erpFilter = signal('');
  sortBy = signal<ProjectSortOption>('name');

  readonly username = computed(() => this.authService.getCurrentUser()?.username ?? '');

  // Sheet load progress — drives the loading / retry states in the template.
  readonly projectsLoading = this.projectsStore.loading;
  readonly projectsLoadError = this.projectsStore.loadError;

  private readonly myProjects = computed(() =>
    this.projectsStore.all().filter((p) => p.user === this.username()),
  );

  // Only offer ERP options that actually appear in this employee's projects.
  readonly availableErps = computed(() => {
    const erps = this.myProjects()
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

    let result = this.myProjects();

    if (query) {
      result = result.filter(
        (p) =>
          p.projectName.toLowerCase().includes(query) ||
          (p.erp && p.erp.toLowerCase().includes(query)) ||
          p.supplier.toLowerCase().includes(query),
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
    // The supplier tells the form which row of the project to edit.
    this.router.navigate(['/project', encodeURIComponent(entry.projectName), 'edit'], {
      queryParams: { supplier: entry.supplier },
      state: { project: entry },
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/login');
  }
}
