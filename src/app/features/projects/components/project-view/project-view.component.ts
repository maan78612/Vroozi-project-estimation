/*
 * ──────────────────────────────────────────────────────────────────
 !  Read-only project detail screen
 *
 *  Reached from the list page's "view" icon. Master-detail layout:
 *  a searchable list of the project's supplier entries on the left,
 *  the selected entry's full field breakdown on the right — so the
 *  screen stays a fixed height and scales to however many suppliers
 *  a project has, instead of stacking one card per supplier down an
 *  ever-growing page. Edit/Delete act on whichever entry is selected.
 * ──────────────────────────────────────────────────────────────────
 */
import { Component, computed, inject, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { UsersService } from '../../../../core/services/users/users-service';
import { ProjectsStoreService } from '../../../../core/services/projects/projects-store.service';
import { RoleService } from '../../../../core/services/role/role-service';
import { ProjectInterface, YesNo } from '../../../../core/intefaces/form/project.interface';
import { ProjectSizeEnum } from '../../../../core/enums/project-size.enum';
import {
  rollupErp,
  rollupInboundTotal,
  rollupInterfacesTotal,
  rollupOutboundTotal,
  rollupRangeLabel,
  rollupSize,
} from '../../../../core/utils/project-rollup.util';
import { COMPLEXITY_FLAGS, RISK_FLAGS } from '../../../../core/config/feature-flags.config';
import { ButtonComponent } from '../../../../shared/compoments/button/button';
import { SpinnerComponent } from '../../../../shared/compoments/spinner/spinner.component';
import { ConfirmDialogComponent } from '../../../../shared/compoments/confirm-dialog/confirm-dialog.component';
import { InitialsPipe } from '../../../../shared/pipes/initials.pipe';

@Component({
  selector: 'app-project-view',
  standalone: true,
  imports: [ButtonComponent, SpinnerComponent, ConfirmDialogComponent, InitialsPipe, NgTemplateOutlet],
  templateUrl: './project-view.component.html',
  styleUrl: './project-view.component.less',
})
export class ProjectViewComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private usersService = inject(UsersService);
  private projectsStore = inject(ProjectsStoreService);
  private roleService = inject(RoleService);

  readonly ProjectSizeEnum = ProjectSizeEnum;
  readonly complexityFlags = COMPLEXITY_FLAGS;
  readonly riskFlags = RISK_FLAGS;

  private readonly routeKey = this.route.snapshot.paramMap.get('key') ?? '';
  private readonly decodedName = decodeURIComponent(this.routeKey);

  readonly isAdmin = this.roleService.isAdmin;
  // Client-role accounts get a read-only view — Edit/Delete are hidden below.
  readonly isClient = this.roleService.isClient;

  private readonly assignableUsers = this.usersService.assignableUsers;

  readonly loading = this.projectsStore.loading;
  readonly loadError = this.projectsStore.loadError;

  /*
   * Every supplier entry for this project. The backend already scopes
   * the whole store per role (admin: everything, user: their own,
   * client: their company's) — don't re-filter by owner here, or a
   * client-user (who isn't the `owner` of any entry) would always see
   * zero results and land on the "not found" state below.
   */
  readonly entries = computed(() => this.projectsStore.entriesFor(this.decodedName));

  readonly notFound = computed(() => !this.loading() && !this.loadError() && this.entries().length === 0);

  constructor() {
    this.projectsStore.load();
    if (this.isAdmin()) this.usersService.load();
  }

  /*
   * ──────────────────────────────────────────────────────────────────
   !  Rolled-up project stats — shared aggregation (project-rollup.util),
   *  same one ProjectCardComponent and the Project List table use.
   * ──────────────────────────────────────────────────────────────────
   */
  projectName(): string {
    return this.entries()[0]?.projectName ?? this.decodedName;
  }

  erp(): string {
    return rollupErp(this.entries());
  }

  // Named suppliers only — '' (chip hidden) when every entry's supplier is blank,
  // matching how ProjectCardComponent already hides its supplier chip in that case.
  supplierSummary(): string {
    const named = this.entries()
      .map((e) => e.supplier)
      .filter(Boolean);
    if (named.length === 0) return '';
    if (named.length <= 3) return named.join(', ');
    return `${named.slice(0, 3).join(', ')} +${named.length - 3}`;
  }

  size(): ProjectSizeEnum | null {
    return rollupSize(this.entries());
  }

  interfacesTotal(): number {
    return rollupInterfacesTotal(this.entries());
  }

  inboundTotal(): number {
    return rollupInboundTotal(this.entries());
  }

  outboundTotal(): number {
    return rollupOutboundTotal(this.entries());
  }

  rangeLabel(): string {
    return rollupRangeLabel(this.entries());
  }

  assignedToName(entry: ProjectInterface): string {
    if (entry.userName) return entry.userName;
    const match = this.assignableUsers().find((u) => u.id === entry.user);
    return match ? match.name : '—';
  }

  flagValue(entry: ProjectInterface, key: keyof ProjectInterface): YesNo {
    return (entry[key] as YesNo) ?? 'No';
  }

  interfacesOf(entry: ProjectInterface): number {
    return entry.masterDataInterfaces + entry.transactionalInterfaces;
  }

  /*
   * ──────────────────────────────────────────────────────────────────
   !  Supplier list pane — search + selection
   * ──────────────────────────────────────────────────────────────────
   */
  supplierQuery = signal('');
  // Keyed by the entry's stable id, not its (optional, non-unique) supplier name —
  // several entries can share a blank supplier, which would make a name-based lookup
  // always resolve to the first one regardless of which row was actually clicked.
  private selectedEntryId = signal('');

  // Mobile only: which pane is showing (both panes always show side by side above
  // the responsive breakpoint, see project-view.component.less).
  mobileDetailOpen = signal(false);

  readonly filteredEntries = computed(() => {
    const query = this.supplierQuery().trim().toLowerCase();
    const all = this.entries();
    if (!query) return all;
    return all.filter((e) => e.supplier.toLowerCase().includes(query));
  });

  // Falls back to the first entry whenever the signal doesn't match anything
  // current — covers the initial load and the "selected entry got deleted" case.
  readonly selectedEntry = computed(() => {
    const list = this.entries();
    return list.find((e) => e.id === this.selectedEntryId()) ?? list[0] ?? null;
  });

  // Single-item array, keyed by id in the template's `@for` — forces the
  // detail pane to remount (and replay its entrance animation) whenever
  // the selected supplier actually changes, instead of just rebinding.
  readonly selectedEntryList = computed(() => {
    const entry = this.selectedEntry();
    return entry ? [entry] : [];
  });

  selectEntry(entry: ProjectInterface): void {
    this.selectedEntryId.set(entry.id ?? '');
    this.mobileDetailOpen.set(true);
  }

  backToList(): void {
    this.mobileDetailOpen.set(false);
  }

  isSelected(entry: ProjectInterface): boolean {
    return this.selectedEntry()?.id === entry.id;
  }

  /*
   * ──────────────────────────────────────────────────────────────────
   !  Edit / Delete — act on the currently selected supplier entry.
   * ──────────────────────────────────────────────────────────────────
   */
  editSelected(): void {
    const entry = this.selectedEntry();
    if (!entry) return;
    const base = this.isAdmin() ? '/admin/projects' : '/project';
    this.router.navigate([base, encodeURIComponent(entry.projectName), 'edit'], {
      queryParams: { supplier: entry.supplier },
      state: { project: entry },
    });
  }

  // Admin-only, same as every other "create" entry point in the app (see
  // ProjectListComponent.addProject()) — lands on the wizard's "existing
  // project" mode with this project preselected.
  addSupplier(): void {
    this.router.navigate(['/admin/projects/new'], {
      queryParams: { project: this.projectName() },
    });
  }

  entryDeleteTarget = signal<ProjectInterface | null>(null);
  deleting = signal(false);
  deleteError = signal('');

  requestDeleteSelected(): void {
    const entry = this.selectedEntry();
    if (!entry) return;
    this.deleteError.set('');
    this.entryDeleteTarget.set(entry);
  }

  cancelDelete(): void {
    if (this.deleting()) return;
    this.entryDeleteTarget.set(null);
  }

  entryDeleteMessage(entry: ProjectInterface): string {
    return `This removes ${entry.supplier || 'this supplier'} from "${entry.projectName}". This can't be undone.`;
  }

  confirmDeleteEntry(): void {
    const entry = this.entryDeleteTarget();
    if (!entry) return;

    this.deleting.set(true);
    this.projectsStore.deleteEntry(entry.projectName, entry.supplier).subscribe({
      next: () => {
        this.deleting.set(false);
        this.entryDeleteTarget.set(null);
        // The deleted entry is gone from the store now — clear the selection
        // so `selectedEntry` falls back to whatever remains.
        this.selectedEntryId.set('');
      },
      error: (err: unknown) => {
        this.deleting.set(false);
        this.deleteError.set(
          err instanceof Error ? err.message : 'Could not delete the supplier. Please try again.',
        );
      },
    });
  }

  /*
   * ──────────────────────────────────────────────────────────────────
   !  Header actions
   * ──────────────────────────────────────────────────────────────────
   */
  onBack(): void {
    this.router.navigateByUrl(this.isAdmin() ? '/admin/projects' : '/project');
  }

  retryLoad(): void {
    this.projectsStore.load();
  }
}
