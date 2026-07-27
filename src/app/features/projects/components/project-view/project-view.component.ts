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
import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NgTemplateOutlet } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
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
  rollupSupplierSummary,
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

  /*
   * Angular reuses this component instance when navigating between two
   * projects' view pages (same route, different :id) — reading
   * route.snapshot once here would freeze on whichever project was first
   * opened. paramMap is an Observable specifically so the id (and
   * everything derived from it) stays live across that reuse.
   *
   * :id is one entry's own id — an anchor picked purely to give this
   * page a stable, unencoded URL instead of the project name. A
   * "project" here is every entry sharing that anchor's project name
   * (there's no single document representing the group itself), so the
   * very first thing derived from it resolves the anchor back to that
   * name. If the anchor entry itself gets deleted later (its sibling
   * suppliers don't), this link goes stale — same tradeoff as any id you
   * copy out of a URL and hold onto after the thing it points to is gone.
   */
  private readonly routeId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('id') ?? '')),
    { initialValue: this.route.snapshot.paramMap.get('id') ?? '' },
  );
  private readonly anchorEntry = computed(() => this.projectsStore.getById(this.routeId()));
  private readonly decodedName = computed(() => this.anchorEntry()?.projectName ?? '');

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
  readonly entries = computed(() => this.projectsStore.entriesFor(this.decodedName()));

  readonly notFound = computed(() => !this.loading() && !this.loadError() && this.entries().length === 0);

  // The supplier list pane only earns its place when there's something to
  // pick between — multiple entries, or a single entry that actually names
  // a supplier. A lone supplier-less entry (e.g. "Client Portal Refresh")
  // would just show a redundant "No supplier" row above its own detail.
  readonly showSupplierList = computed(() => {
    const list = this.entries();
    return list.length > 1 || !!list[0]?.supplier;
  });

  constructor() {
    this.projectsStore.load();
    if (this.isAdmin()) this.usersService.load();

    // Same reuse gap as decodedName above: reset per-project UI state
    // whenever the route key actually changes, or a stale search query /
    // selected supplier silently carries over from whichever project was
    // viewed previously in this reused instance.
    effect(() => {
      this.decodedName();
      this.selectedEntryId.set('');
      this.supplierQuery.set('');
      this.mobileDetailOpen.set(false);
    });
  }

  /*
   * ──────────────────────────────────────────────────────────────────
   !  Rolled-up project stats — shared aggregation (project-rollup.util),
   *  same one ProjectCardComponent and the Project List table use.
   * ──────────────────────────────────────────────────────────────────
   */
  projectName(): string {
    return this.entries()[0]?.projectName ?? this.decodedName();
  }

  erp(): string {
    return rollupErp(this.entries());
  }

  // Named suppliers only — '' (chip hidden) when every entry's supplier is blank,
  // matching how ProjectCardComponent already hides its supplier chip in that case.
  supplierSummary(): string {
    return rollupSupplierSummary(this.entries());
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
    if (!entry?.id) return;
    const base = this.isAdmin() ? '/admin/projects' : '/project';
    this.router.navigate([base, entry.id, 'edit'], { state: { project: entry } });
  }

  // Opens the same edit form pre-filled from this entry, but in create mode
  // (see ProjectFormComponent.isDuplicateMode) — Save produces a new entry,
  // the original is untouched. The "(Copy)" suffix is applied after load,
  // in the form.
  duplicateSelected(): void {
    const entry = this.selectedEntry();
    if (!entry?.id) return;
    const base = this.isAdmin() ? '/admin/projects' : '/project';
    this.router.navigate([base, entry.id, 'edit'], {
      queryParams: { mode: 'duplicate' },
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
    this.projectsStore.deleteEntry(entry.id ?? '').subscribe({
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
