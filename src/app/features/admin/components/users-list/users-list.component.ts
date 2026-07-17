import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { UsersService } from '../../../../core/services/users/users-service';
import { ProjectsStoreService } from '../../../../core/services/projects/projects-store.service';
import { UserInterface } from '../../../../core/intefaces/user-interface';
import { ButtonComponent } from '../../../../shared/compoments/button/button';
import { DataTableComponent } from '../../../../shared/compoments/data-table/data-table.component';
import { PaginationComponent } from '../../../../shared/compoments/pagination/pagination.component';
import { AddOptionDialogComponent } from '../../../../shared/compoments/add-option-dialog/add-option-dialog.component';
import { InitialsPipe } from '../../../../shared/pipes/initials.pipe';
import { FormFieldInterface } from '../../../../core/intefaces/form/form-field.interface';
import { FieldTypeEnum } from '../../../../core/enums/field-type.enum';

/*
 * ──────────────────────────────────────────────────────────────────
 !  Admin-only directory of employees
 *
 *  Shows every employee a project can be assigned to, alongside how
 *  many (and which) projects they currently own — so an admin can
 *  see workload at a glance and jump into that employee's projects.
 *
 *  No "Role" column: `assignableUsers` is already server-filtered to
 *  role=user (see users-service.ts), so every row would show the
 *  identical value — not a real column, just noise.
 * ──────────────────────────────────────────────────────────────────
 */

// Rows show at most this many project chips before collapsing the rest into "+N more".
const MAX_VISIBLE_PROJECTS = 4;
const PAGE_SIZE = 10;

type EmployeeSortOption = 'name' | 'projects';

// Password is required on create, optional on edit (blank = keep the
// current password) — same split as CLIENT_CREATE_FIELDS/CLIENT_EDIT_FIELDS
// in client-fields.config.ts.
const BASE_EMPLOYEE_FIELDS: FormFieldInterface[] = [
  {
    key: 'name',
    label: 'Full name',
    type: FieldTypeEnum.Text,
    required: true,
    placeholder: 'e.g. Priya Nandakumar',
    icon: 'person',
    autofocus: true,
  },
  {
    key: 'email',
    label: 'Email',
    type: FieldTypeEnum.Text,
    required: true,
    inputType: 'email',
    placeholder: 'priya@company.com',
    icon: 'mail',
  },
];

const TRAILING_EMPLOYEE_FIELDS: FormFieldInterface[] = [
  {
    key: 'jobTitle',
    label: 'Job title',
    type: FieldTypeEnum.Text,
    required: false,
    placeholder: 'e.g. Solutions Architect',
    icon: 'badge',
  },
  {
    key: 'department',
    label: 'Department',
    type: FieldTypeEnum.Text,
    required: false,
    placeholder: 'e.g. Integrations',
    icon: 'apartment',
  },
];

const EMPLOYEE_CREATE_FIELDS: FormFieldInterface[] = [
  ...BASE_EMPLOYEE_FIELDS,
  {
    key: 'password',
    label: 'Password',
    type: FieldTypeEnum.Text,
    required: true,
    inputType: 'password',
    placeholder: 'Minimum 8 characters',
    icon: 'lock',
  },
  ...TRAILING_EMPLOYEE_FIELDS,
];

const EMPLOYEE_EDIT_FIELDS: FormFieldInterface[] = [
  ...BASE_EMPLOYEE_FIELDS,
  {
    key: 'password',
    label: 'Password',
    type: FieldTypeEnum.Text,
    required: false,
    inputType: 'password',
    placeholder: 'Leave blank to keep the current password',
    icon: 'lock',
  },
  ...TRAILING_EMPLOYEE_FIELDS,
];

@Component({
  selector: 'app-users-list',
  imports: [
    ButtonComponent,
    DataTableComponent,
    PaginationComponent,
    AddOptionDialogComponent,
    InitialsPipe,
  ],
  templateUrl: './users-list.component.html',
  styleUrl: './users-list.component.less',
})
export class UsersListComponent {
  private usersService = inject(UsersService);
  private projectsStore = inject(ProjectsStoreService);
  private router = inject(Router);

  readonly fields = computed(() => (this.editTarget() ? EMPLOYEE_EDIT_FIELDS : EMPLOYEE_CREATE_FIELDS));

  searchQuery = signal('');
  sortBy = signal<EmployeeSortOption>('name');
  page = signal(1);

  private readonly employees = this.usersService.assignableUsers;

  // Employees + their project chips both come from the API.
  readonly isLoading = computed(
    () => this.usersService.loading() || this.projectsStore.loading(),
  );
  readonly loadError = this.usersService.loadError;

  constructor() {
    // Both lists come from the API — refresh them on page entry.
    this.usersService.load();
    this.projectsStore.load();
  }

  retryLoad(): void {
    this.usersService.load();
    this.projectsStore.load();
  }

  readonly filteredEmployees = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    let result = this.employees();
    if (query) {
      result = result.filter(
        (u) => u.name.toLowerCase().includes(query) || u.email.toLowerCase().includes(query),
      );
    }

    const sorted = [...result];
    if (this.sortBy() === 'projects') {
      sorted.sort((a, b) => this.projectsFor(b).length - this.projectsFor(a).length);
    } else {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    }
    return sorted;
  });

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredEmployees().length / PAGE_SIZE)),
  );

  // Clamped view of `page` — a shrinking list (e.g. rows removed while on
  // the last page) can never strand the table on a page that no longer exists.
  readonly currentPage = computed(() => Math.min(this.page(), this.totalPages()));

  readonly rangeStart = computed(() =>
    this.filteredEmployees().length === 0 ? 0 : (this.currentPage() - 1) * PAGE_SIZE + 1,
  );
  readonly rangeEnd = computed(() =>
    Math.min(this.currentPage() * PAGE_SIZE, this.filteredEmployees().length),
  );

  readonly pagedEmployees = computed(() => {
    const start = (this.currentPage() - 1) * PAGE_SIZE;
    return this.filteredEmployees().slice(start, start + PAGE_SIZE);
  });

  onSearchChange(value: string): void {
    this.searchQuery.set(value);
    this.page.set(1);
  }

  setSortBy(value: EmployeeSortOption): void {
    this.sortBy.set(value);
    this.page.set(1);
  }

  // Distinct project names — an employee may own several supplier entries of one project.
  projectsFor(user: UserInterface): string[] {
    const names = this.projectsStore
      .all()
      .filter((p) => p.user === user.id)
      .map((p) => p.projectName);
    return Array.from(new Set(names));
  }

  visibleProjectsFor(user: UserInterface): string[] {
    return this.projectsFor(user).slice(0, MAX_VISIBLE_PROJECTS);
  }

  remainingProjectsCountFor(user: UserInterface): number {
    return Math.max(0, this.projectsFor(user).length - MAX_VISIBLE_PROJECTS);
  }

  // Avatar letters come from the shared `initials` pipe (see template).

  viewProjects(user: UserInterface): void {
    this.router.navigate(['/admin/projects'], {
      queryParams: { q: user.name },
    });
  }

  // ── Add / edit employee (same dialog — `editTarget` tells save() which) ──
  dialogOpen = signal(false);
  editTarget = signal<UserInterface | null>(null);
  saving = signal(false);
  saveError = signal('');

  readonly dialogTitle = computed(() => (this.editTarget() ? 'Edit Employee' : 'Add Employee'));
  readonly dialogSubtitle = computed(() =>
    this.editTarget()
      ? 'Update this employee’s account details.'
      : 'Creates a sign-in account with the User role.',
  );
  readonly dialogInitialValue = computed<Record<string, string>>(() => {
    const target = this.editTarget();
    if (!target) return {} as Record<string, string>;
    // Password is never prefilled — blank means "keep the current one" on edit.
    return {
      name: target.name,
      email: target.email,
      jobTitle: target.jobTitle ?? '',
      department: target.department ?? '',
    };
  });

  openAdd(): void {
    this.editTarget.set(null);
    this.saveError.set('');
    this.dialogOpen.set(true);
  }

  openEdit(employee: UserInterface): void {
    this.editTarget.set(employee);
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
    const jobTitle = (value['jobTitle'] as string)?.trim() || undefined;
    const department = (value['department'] as string)?.trim() || undefined;
    if (!name || !email) return;

    const target = this.editTarget();
    if (!target && !password) return; // password required on create

    this.saving.set(true);
    this.saveError.set('');

    const save$ = target
      ? this.usersService.update(target.id, { name, email, password, jobTitle, department })
      : this.usersService.create({ name, email, password: password!, jobTitle, department });

    save$.subscribe({
      next: () => {
        this.saving.set(false);
        this.dialogOpen.set(false);
      },
      error: (err: unknown) => {
        this.saving.set(false);
        this.saveError.set(err instanceof Error ? err.message : 'Could not save the employee.');
      },
    });
  }
}
