import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth/auth-service';
import { ProjectsStoreService } from '../../../../core/services/projects/projects-store.service';
import { ProjectInterface } from '../../../../core/intefaces/form/project.interface';
import { ProjectSizeEnum } from '../../../../core/enums/project-size.enum';
import { RoleEnum } from '../../../../core/enums/role-enum';
import { ProjectSortOption, sortProjects } from '../../../../core/utils/project-sort.util';
import { ProjectGroup, groupProjects } from '../../../../core/utils/project-group.util';
import { ButtonComponent } from '../../../../shared/compoments/button/button';
import { ProjectCardComponent } from '../../../../shared/compoments/project-card/project-card.component';
import { ProjectFilterBarComponent } from '../../../../shared/compoments/project-filter-bar/project-filter-bar.component';
import { SupplierPickerComponent } from '../../../../shared/compoments/supplier-picker/supplier-picker.component';
import { ConfirmDialogComponent } from '../../../../shared/compoments/confirm-dialog/confirm-dialog.component';

/*
 * ──────────────────────────────────────────────────────────────────
 !  Project list — shared by the Admin and User roles
 *
 *  Admins see every project with an "assigned to" chip and can add
 *  new ones; a regular user sees only the projects assigned to them.
 *  `isAdmin` (from the signed-in role) toggles the parts that differ;
 *  everything else — filtering, grouping, edit/delete — is shared.
 * ──────────────────────────────────────────────────────────────────
 */
@Component({
  selector: 'app-project-list',
  imports: [
    ButtonComponent,
    RouterLink,
    ProjectCardComponent,
    ProjectFilterBarComponent,
    SupplierPickerComponent,
    ConfirmDialogComponent,
  ],
  templateUrl: './project-list.component.html',
  styleUrl: './project-list.component.less',
})
export class ProjectListComponent {
  private authService = inject(AuthService);
  private projectsStore = inject(ProjectsStoreService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  readonly isAdmin = computed(() => this.authService.getRole() === RoleEnum.Admin);

  // Pre-filled when an admin arrives from the Employees list via "View projects".
  searchQuery = signal(this.route.snapshot.queryParamMap.get('q') ?? '');
  sizeFilter = signal<ProjectSizeEnum | null>(null);
  erpFilter = signal('');
  sortBy = signal<ProjectSortOption>('name');

  // Every employee a project can be assigned to — feeds the admin "assigned to" chip.
  private readonly assignableUsers = this.authService.getAssignableUsers();

  readonly username = computed(() => this.authService.getCurrentUser()?.username ?? '');

  // Sheet load progress — drives the loading / retry states in the template.
  readonly projectsLoading = this.projectsStore.loading;
  readonly projectsLoadError = this.projectsStore.loadError;

  private readonly myProjects = computed(() =>
    this.projectsStore.all().filter((p) => p.user === this.username()),
  );

  private readonly baseProjects = computed(() =>
    this.isAdmin() ? this.projectsStore.all() : this.myProjects(),
  );

  // Only offer ERP options that actually appear in the visible projects.
  readonly availableErps = computed(() => {
    const erps = this.baseProjects()
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

    let result = this.baseProjects();

    if (query) {
      result = result.filter(
        (p) =>
          p.projectName.toLowerCase().includes(query) ||
          (p.erp && p.erp.toLowerCase().includes(query)) ||
          p.supplier.toLowerCase().includes(query) ||
          (this.isAdmin() && this.assignedToName(p).toLowerCase().includes(query)),
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

  // Pending destructive actions — set while their confirm dialog is open.
  projectDeleteTarget = signal<ProjectGroup | null>(null);
  entryDeleteTarget = signal<ProjectInterface | null>(null);
  deleting = signal(false);
  deleteError = signal('');

  assignedToName(project: ProjectInterface): string {
    const match = this.assignableUsers.find((u) => u.username === project.user);
    return match ? match.fullName || match.username : project.user;
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
    const base = this.isAdmin() ? '/admin/projects' : '/project';
    // The supplier tells the form which row of the project to edit.
    this.router.navigate([base, encodeURIComponent(entry.projectName), 'edit'], {
      queryParams: { supplier: entry.supplier },
      state: { project: entry },
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/login');
  }

  requestDeleteGroup(group: ProjectGroup): void {
    this.deleteError.set('');
    this.projectDeleteTarget.set(group);
  }

  requestDeleteEntry(entry: ProjectInterface): void {
    this.deleteError.set('');
    this.entryDeleteTarget.set(entry);
  }

  cancelDelete(): void {
    if (this.deleting()) return;
    this.projectDeleteTarget.set(null);
    this.entryDeleteTarget.set(null);
  }

  projectDeleteMessage(group: ProjectGroup): string {
    const count = group.entries.length;
    return `This removes "${group.projectName}" and its ${count} supplier ${count === 1 ? 'entry' : 'entries'}. This can't be undone.`;
  }

  entryDeleteMessage(entry: ProjectInterface): string {
    return `This removes ${entry.supplier || 'this supplier'} from "${entry.projectName}". This can't be undone.`;
  }

  confirmDeleteProject(): void {
    const group = this.projectDeleteTarget();
    if (!group) return;

    this.deleting.set(true);
    this.projectsStore.deleteProject(group.projectName).subscribe({
      next: () => {
        this.deleting.set(false);
        this.projectDeleteTarget.set(null);
      },
      error: (err: unknown) => {
        this.deleting.set(false);
        this.deleteError.set(
          err instanceof Error ? err.message : 'Could not delete the project. Please try again.',
        );
      },
    });
  }

  confirmDeleteEntry(): void {
    const entry = this.entryDeleteTarget();
    if (!entry) return;

    this.deleting.set(true);
    this.projectsStore.deleteEntry(entry.projectName, entry.supplier).subscribe({
      next: () => {
        this.deleting.set(false);
        this.entryDeleteTarget.set(null);
        // The picker's snapshot no longer matches the store — close it.
        this.pickerGroup.set(null);
      },
      error: (err: unknown) => {
        this.deleting.set(false);
        this.deleteError.set(
          err instanceof Error ? err.message : 'Could not delete the supplier. Please try again.',
        );
      },
    });
  }
}
