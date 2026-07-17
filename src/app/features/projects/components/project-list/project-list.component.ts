import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UsersService } from '../../../../core/services/users/users-service';
import { ProjectsStoreService } from '../../../../core/services/projects/projects-store.service';
import { RoleService } from '../../../../core/services/role/role-service';
import { ProjectInterface } from '../../../../core/intefaces/form/project.interface';
import { ProjectSizeEnum } from '../../../../core/enums/project-size.enum';
import { ProjectSortOption, sortProjects } from '../../../../core/utils/project-sort.util';
import { ProjectGroup, groupProjects } from '../../../../core/utils/project-group.util';
import {
  rollupClient,
  rollupErp,
  rollupRangeLabel,
  rollupSize,
} from '../../../../core/utils/project-rollup.util';
import { ButtonComponent } from '../../../../shared/compoments/button/button';
import { DataTableComponent } from '../../../../shared/compoments/data-table/data-table.component';
import { PaginationComponent } from '../../../../shared/compoments/pagination/pagination.component';
import { ProjectFilterBarComponent } from '../../../../shared/compoments/project-filter-bar/project-filter-bar.component';
import { ConfirmDialogComponent } from '../../../../shared/compoments/confirm-dialog/confirm-dialog.component';
import { SpinnerComponent } from '../../../../shared/compoments/spinner/spinner.component';

const PAGE_SIZE = 10;

/*
 * ──────────────────────────────────────────────────────────────────
 !  Project list — shared by the Admin, User and Client roles
 *
 *  Admins see every project with an "assigned to" chip and can add
 *  new ones; a regular user sees only the projects assigned to them;
 *  a client-user sees every project tagged with their client company.
 *  The backend already returns the right slice per role — this
 *  component never re-filters it, only adapts copy/actions by role.
 *  `isAdmin`/`isClient` (from the signed-in role) toggle the parts
 *  that differ; everything else — filtering, grouping, edit — is shared.
 * ──────────────────────────────────────────────────────────────────
 */
@Component({
  selector: 'app-project-list',
  imports: [
    ButtonComponent,
    DataTableComponent,
    PaginationComponent,
    ProjectFilterBarComponent,
    ConfirmDialogComponent,
    SpinnerComponent,
  ],
  templateUrl: './project-list.component.html',
  styleUrl: './project-list.component.less',
})
export class ProjectListComponent {
  private usersService = inject(UsersService);
  private projectsStore = inject(ProjectsStoreService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private roleService = inject(RoleService);

  readonly isAdmin = this.roleService.isAdmin;
  readonly isClient = this.roleService.isClient;

  // Pre-filled when an admin arrives from the Employees list via "View projects".
  searchQuery = signal(this.route.snapshot.queryParamMap.get('q') ?? '');
  sizeFilter = signal<ProjectSizeEnum | null>(null);
  erpFilter = signal('');
  sortBy = signal<ProjectSortOption>('name');
  page = signal(1);

  // Every employee a project can be assigned to — feeds the admin "assigned to" chip.
  private readonly assignableUsers = this.usersService.assignableUsers;

  // Load progress — drives the loading / retry states in the template.
  readonly projectsLoading = this.projectsStore.loading;
  readonly projectsLoadError = this.projectsStore.loadError;

  constructor() {
    // Always re-fetch on page entry so the list reflects the server
    // (and the currently signed-in user, not a previous session).
    this.projectsStore.load();
    // The employee directory is an admin-only endpoint.
    if (this.isAdmin()) this.usersService.load();
  }

  // The backend already scopes the list per role (admin: everything,
  // user: their own, client: their company's) — trust it directly rather
  // than re-filtering client-side, which would wrongly hide a client-user's
  // projects (they're not the `owner` of any of them).
  private readonly baseProjects = this.projectsStore.all;

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
          (this.isAdmin() && this.assignedToName(p).toLowerCase().includes(query)) ||
          (this.isAdmin() && !!p.clientName && p.clientName.toLowerCase().includes(query)),
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

  // ── Pagination — over groups (table rows), same convention as
  // users-list / clients-list. `currentPage` clamps rather than trusting
  // `page` directly so deleting the last row of the last page can never
  // strand the table on a page that no longer exists.
  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredGroups().length / PAGE_SIZE)),
  );
  readonly currentPage = computed(() => Math.min(this.page(), this.totalPages()));

  readonly pagedGroups = computed(() => {
    const start = (this.currentPage() - 1) * PAGE_SIZE;
    return this.filteredGroups().slice(start, start + PAGE_SIZE);
  });

  readonly rangeStart = computed(() =>
    this.filteredGroups().length === 0 ? 0 : (this.currentPage() - 1) * PAGE_SIZE + 1,
  );
  readonly rangeEnd = computed(() =>
    Math.min(this.currentPage() * PAGE_SIZE, this.filteredGroups().length),
  );

  // Pending destructive action — set while the confirm dialog is open.
  projectDeleteTarget = signal<ProjectGroup | null>(null);
  deleting = signal(false);
  deleteError = signal('');

  assignedToName(project: ProjectInterface): string {
    if (project.userName) return project.userName;
    const match = this.assignableUsers().find((u) => u.id === project.user);
    return match ? match.name : '—';
  }

  // Group chip: the shared owner's name, or "Multiple" when suppliers differ.
  assignedToNameForGroup(group: ProjectGroup): string {
    const names = new Set(group.entries.map((e) => this.assignedToName(e)));
    return names.size === 1 ? this.assignedToName(group.entries[0]) : 'Multiple';
  }

  // Table row columns — same rollup ProjectCardComponent / ProjectViewComponent use.
  erpForGroup(group: ProjectGroup): string {
    return rollupErp(group.entries) || '—';
  }

  sizeForGroup(group: ProjectGroup): ProjectSizeEnum | null {
    return rollupSize(group.entries);
  }

  rangeForGroup(group: ProjectGroup): string {
    const range = rollupRangeLabel(group.entries);
    return range ? `${range} days` : '—';
  }

  clientForGroup(group: ProjectGroup): string {
    return rollupClient(group.entries) || '—';
  }

  // Any filter/sort change restarts at page 1 — the old offset is
  // meaningless against a different result set.
  onSearchChange(value: string): void {
    this.searchQuery.set(value);
    this.page.set(1);
  }

  onErpChange(value: string): void {
    this.erpFilter.set(value);
    this.page.set(1);
  }

  onSortChange(value: ProjectSortOption): void {
    this.sortBy.set(value);
    this.page.set(1);
  }

  toggleSizeFilter(size: ProjectSizeEnum): void {
    this.sizeFilter.set(this.sizeFilter() === size ? null : size);
    this.page.set(1);
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.sizeFilter.set(null);
    this.erpFilter.set('');
    this.page.set(1);
  }

  retryLoad(): void {
    this.projectsStore.load();
  }

  addProject(): void {
    this.router.navigateByUrl('/admin/projects/new');
  }

  // The view screen shows the full rolled-up project and is where editing starts.
  viewGroup(group: ProjectGroup): void {
    const base = this.isAdmin() ? '/admin/projects' : '/project';
    this.router.navigate([base, encodeURIComponent(group.projectName), 'view']);
  }

  requestDeleteGroup(group: ProjectGroup): void {
    this.deleteError.set('');
    this.projectDeleteTarget.set(group);
  }

  cancelDelete(): void {
    if (this.deleting()) return;
    this.projectDeleteTarget.set(null);
  }

  projectDeleteMessage(group: ProjectGroup): string {
    const count = group.entries.length;
    return `This removes "${group.projectName}" and its ${count} supplier ${count === 1 ? 'entry' : 'entries'}. This can't be undone.`;
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
}
