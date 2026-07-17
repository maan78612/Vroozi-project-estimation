import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { ButtonComponent } from '../../../../shared/compoments/button/button';
import { DataTableComponent } from '../../../../shared/compoments/data-table/data-table.component';
import { PaginationComponent } from '../../../../shared/compoments/pagination/pagination.component';
import { AddOptionDialogComponent } from '../../../../shared/compoments/add-option-dialog/add-option-dialog.component';
import { ConfirmDialogComponent } from '../../../../shared/compoments/confirm-dialog/confirm-dialog.component';
import { ClientUsersService } from '../../../../core/services/client-users/client-users-service';
import { ProjectsStoreService } from '../../../../core/services/projects/projects-store.service';
import { UserInterface } from '../../../../core/intefaces/user-interface';
import { CLIENT_CREATE_FIELDS, CLIENT_EDIT_FIELDS } from '../../../../core/config/client-fields.config';

const PAGE_SIZE = 10;

// Rows show at most this many project chips before collapsing the rest
// into "+N more" — same convention as users-list.component.ts.
const MAX_VISIBLE_PROJECTS = 4;

type ClientSortOption = 'name' | 'projects';

/*
 * ──────────────────────────────────────────────────────────────────
 !  Clients Directory — admin-only. A "client" is a role="client" User
 *  (a real login account: name/email/password), not a separate
 *  catalog entity — a project is directly assigned to one client user,
 *  the same way it's assigned to one employee via `user`. "Total
 *  Projects" is still computed client-side from ProjectsStoreService
 *  (same idea as users-list's projectsFor(user)).
 * ──────────────────────────────────────────────────────────────────
 */
@Component({
  selector: 'app-clients-list',
  standalone: true,
  imports: [ButtonComponent, DataTableComponent, PaginationComponent, AddOptionDialogComponent, ConfirmDialogComponent],
  templateUrl: './clients-list.component.html',
  styleUrl: './clients-list.component.less',
})
export class ClientsListComponent {
  private clientUsersService = inject(ClientUsersService);
  private projectsStore = inject(ProjectsStoreService);
  private router = inject(Router);

  readonly fields = computed(() => (this.editTarget() ? CLIENT_EDIT_FIELDS : CLIENT_CREATE_FIELDS));

  searchQuery = signal('');
  sortBy = signal<ClientSortOption>('name');
  page = signal(1);

  readonly isLoading = computed(
    () => this.clientUsersService.loading() || this.projectsStore.loading(),
  );
  readonly loadError = this.clientUsersService.loadError;

  private readonly companies = this.clientUsersService.clientUsers;

  constructor() {
    this.clientUsersService.load();
    this.projectsStore.load();
  }

  retryLoad(): void {
    this.clientUsersService.load();
    this.projectsStore.load();
  }

  projectCountFor(client: UserInterface): number {
    return this.projectsFor(client).length;
  }

  // Distinct project names — a client may have several supplier entries of one project.
  projectsFor(client: UserInterface): string[] {
    const names = this.projectsStore
      .all()
      .filter((p) => p.client === client.id)
      .map((p) => p.projectName);
    return Array.from(new Set(names));
  }

  visibleProjectsFor(client: UserInterface): string[] {
    return this.projectsFor(client).slice(0, MAX_VISIBLE_PROJECTS);
  }

  remainingProjectsCountFor(client: UserInterface): number {
    return Math.max(0, this.projectsFor(client).length - MAX_VISIBLE_PROJECTS);
  }

  viewProjects(client: UserInterface): void {
    this.router.navigate(['/admin/projects'], {
      queryParams: { q: client.name },
    });
  }

  readonly filteredCompanies = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    let result = this.companies();
    if (query) {
      result = result.filter(
        (c) => c.name.toLowerCase().includes(query) || c.email.toLowerCase().includes(query),
      );
    }

    const sorted = [...result];
    if (this.sortBy() === 'projects') {
      sorted.sort((a, b) => this.projectCountFor(b) - this.projectCountFor(a));
    } else {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    }
    return sorted;
  });

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredCompanies().length / PAGE_SIZE)),
  );

  // Clamped view of `page` — a shrinking list (e.g. deleting the last client
  // on the last page) can never strand the table on a page that no longer exists.
  readonly currentPage = computed(() => Math.min(this.page(), this.totalPages()));

  readonly rangeStart = computed(() =>
    this.filteredCompanies().length === 0 ? 0 : (this.currentPage() - 1) * PAGE_SIZE + 1,
  );
  readonly rangeEnd = computed(() =>
    Math.min(this.currentPage() * PAGE_SIZE, this.filteredCompanies().length),
  );

  readonly pagedCompanies = computed(() => {
    const start = (this.currentPage() - 1) * PAGE_SIZE;
    return this.filteredCompanies().slice(start, start + PAGE_SIZE);
  });

  onSearchChange(value: string): void {
    this.searchQuery.set(value);
    this.page.set(1);
  }

  setSortBy(value: ClientSortOption): void {
    this.sortBy.set(value);
    this.page.set(1);
  }

  // ── Add / edit client (same dialog — `editTarget` tells save() which) ──
  dialogOpen = signal(false);
  editTarget = signal<UserInterface | null>(null);
  saving = signal(false);
  saveError = signal('');

  readonly dialogTitle = computed(() => (this.editTarget() ? 'Edit Client' : 'Add Client'));
  readonly dialogInitialValue = computed<Record<string, string>>(() => {
    const target = this.editTarget();
    if (!target) return {} as Record<string, string>;
    // Password is never prefilled — blank means "keep the current one" on edit.
    return { name: target.name, email: target.email };
  });

  openAdd(): void {
    this.editTarget.set(null);
    this.saveError.set('');
    this.dialogOpen.set(true);
  }

  openEdit(client: UserInterface): void {
    this.editTarget.set(client);
    this.saveError.set('');
    this.dialogOpen.set(true);
  }

  closeDialog(): void {
    if (this.saving()) return;
    this.dialogOpen.set(false);
  }

  saveDialog(value: Record<string, string | number>): void {
    const name = (value['name'] as string)?.trim();
    const email = (value['email'] as string)?.trim();
    const password = (value['password'] as string) || undefined;
    if (!name || !email) return;

    const target = this.editTarget();
    if (!target && !password) return; // password required on create

    this.saving.set(true);
    this.saveError.set('');

    const save$: Observable<unknown> = target
      ? this.clientUsersService.update(target.id, { name, email, password })
      : this.clientUsersService.create({ name, email, password: password! });

    save$.subscribe({
      next: () => {
        this.saving.set(false);
        this.dialogOpen.set(false);
      },
      error: (err: unknown) => {
        this.saving.set(false);
        this.saveError.set(err instanceof Error ? err.message : 'Could not save the client.');
      },
    });
  }

  // ── Delete client ────────────────────────────────────────────────────
  deleteTarget = signal<UserInterface | null>(null);
  deleting = signal(false);
  deleteError = signal('');

  requestDelete(client: UserInterface): void {
    this.deleteError.set('');
    this.deleteTarget.set(client);
  }

  cancelDelete(): void {
    if (this.deleting()) return;
    this.deleteTarget.set(null);
  }

  confirmDelete(): void {
    const target = this.deleteTarget();
    if (!target) return;

    this.deleting.set(true);
    this.clientUsersService.delete(target.id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.deleteTarget.set(null);
      },
      error: (err: unknown) => {
        this.deleting.set(false);
        this.deleteError.set(
          err instanceof Error ? err.message : 'Could not delete the client.',
        );
      },
    });
  }
}
