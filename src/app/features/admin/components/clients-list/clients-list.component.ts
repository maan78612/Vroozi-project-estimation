import { Component, computed, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { ButtonComponent } from '../../../../shared/compoments/button/button';
import { DataTableComponent } from '../../../../shared/compoments/data-table/data-table.component';
import { PaginationComponent } from '../../../../shared/compoments/pagination/pagination.component';
import { AddOptionDialogComponent } from '../../../../shared/compoments/add-option-dialog/add-option-dialog.component';
import { ConfirmDialogComponent } from '../../../../shared/compoments/confirm-dialog/confirm-dialog.component';
import { ClientCompaniesService } from '../../../../core/services/client-companies/client-companies-service';
import { ProjectsStoreService } from '../../../../core/services/projects/projects-store.service';
import { ApiClientCompany } from '../../../../core/intefaces/api.interface';
import { CLIENT_COMPANY_FIELDS } from '../../../../core/config/client-fields.config';

const PAGE_SIZE = 10;

type ClientSortOption = 'name' | 'projects';

/*
 * ──────────────────────────────────────────────────────────────────
 !  Clients Directory — admin-only. Name/email/primary-contact are all
 *  real backend fields (ClientCompany was extended alongside this
 *  page); "Total Projects" is still computed client-side from
 *  ProjectsStoreService (same idea as users-list's projectsFor(user)),
 *  since a project only stores the client company NAME, not a count.
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
  private clientCompaniesService = inject(ClientCompaniesService);
  private projectsStore = inject(ProjectsStoreService);

  readonly fields = CLIENT_COMPANY_FIELDS;

  searchQuery = signal('');
  sortBy = signal<ClientSortOption>('name');
  page = signal(1);

  readonly isLoading = computed(
    () => this.clientCompaniesService.loading() || this.projectsStore.loading(),
  );
  readonly loadError = this.clientCompaniesService.loadError;

  private readonly companies = this.clientCompaniesService.clientCompanies;

  constructor() {
    this.clientCompaniesService.load();
    this.projectsStore.load();
  }

  retryLoad(): void {
    this.clientCompaniesService.load();
    this.projectsStore.load();
  }

  projectCountFor(company: ApiClientCompany): number {
    return this.projectsStore.all().filter((p) => p.clientCompany === company.name).length;
  }

  readonly filteredCompanies = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    let result = this.companies();
    if (query) {
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          (c.email ?? '').toLowerCase().includes(query) ||
          (c.primaryContact ?? '').toLowerCase().includes(query),
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

  readonly rangeStart = computed(() =>
    this.filteredCompanies().length === 0 ? 0 : (this.page() - 1) * PAGE_SIZE + 1,
  );
  readonly rangeEnd = computed(() =>
    Math.min(this.page() * PAGE_SIZE, this.filteredCompanies().length),
  );

  readonly pagedCompanies = computed(() => {
    const start = (this.page() - 1) * PAGE_SIZE;
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
  editTarget = signal<ApiClientCompany | null>(null);
  saving = signal(false);
  saveError = signal('');

  readonly dialogTitle = computed(() => (this.editTarget() ? 'Edit Client Company' : 'Add Client Company'));
  readonly dialogInitialValue = computed<Record<string, string>>(() => {
    const target = this.editTarget();
    if (!target) return {} as Record<string, string>;
    return { name: target.name, email: target.email ?? '', primaryContact: target.primaryContact ?? '' };
  });

  openAdd(): void {
    this.editTarget.set(null);
    this.saveError.set('');
    this.dialogOpen.set(true);
  }

  openEdit(company: ApiClientCompany): void {
    this.editTarget.set(company);
    this.saveError.set('');
    this.dialogOpen.set(true);
  }

  closeDialog(): void {
    if (this.saving()) return;
    this.dialogOpen.set(false);
  }

  saveDialog(value: Record<string, string | number>): void {
    const name = (value['name'] as string)?.trim();
    const email = (value['email'] as string)?.trim() || undefined;
    const primaryContact = (value['primaryContact'] as string)?.trim() || undefined;
    if (!name) return;

    this.saving.set(true);
    this.saveError.set('');

    const target = this.editTarget();
    const save$: Observable<unknown> = target
      ? this.clientCompaniesService.update(target._id, { name, email, primaryContact })
      : this.clientCompaniesService.create(name, email, primaryContact);

    save$.subscribe({
      next: () => {
        this.saving.set(false);
        this.dialogOpen.set(false);
      },
      error: (err: unknown) => {
        this.saving.set(false);
        this.saveError.set(err instanceof Error ? err.message : 'Could not save the client company.');
      },
    });
  }

  // ── Delete client ────────────────────────────────────────────────────
  deleteTarget = signal<ApiClientCompany | null>(null);
  deleting = signal(false);
  deleteError = signal('');

  requestDelete(company: ApiClientCompany): void {
    this.deleteError.set('');
    this.deleteTarget.set(company);
  }

  cancelDelete(): void {
    if (this.deleting()) return;
    this.deleteTarget.set(null);
  }

  confirmDelete(): void {
    const target = this.deleteTarget();
    if (!target) return;

    this.deleting.set(true);
    this.clientCompaniesService.delete(target._id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.deleteTarget.set(null);
      },
      error: (err: unknown) => {
        this.deleting.set(false);
        this.deleteError.set(
          err instanceof Error ? err.message : 'Could not delete the client company.',
        );
      },
    });
  }
}
