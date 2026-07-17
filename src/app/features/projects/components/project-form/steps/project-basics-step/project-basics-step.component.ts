import { Component, computed, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ProjectInterface } from '../../../../../../core/intefaces/form/project.interface';
import { UserInterface } from '../../../../../../core/intefaces/user-interface';
import { hasError } from '../../../../../../core/utils/form-control.util';
import {
  SearchDropdownComponent,
  SearchDropdownOption,
} from '../../../../../../shared/compoments/search-dropdown/search-dropdown.component';

@Component({
  selector: 'app-project-basics-step',
  standalone: true,
  imports: [ReactiveFormsModule, SearchDropdownComponent],
  templateUrl: './project-basics-step.component.html',
  styleUrl: './project-basics-step.component.less',
})
export class ProjectBasicsStepComponent {
  form = input.required<FormGroup>();
  isEditMode = input(false);
  isAdmin = input(false);
  assignableUsers = input<UserInterface[]>([]);
  entryMode = input<'new' | 'existing'>('new');
  existingProjects = input<string[]>([]);
  // Pick-lists come from the API (GET /erps, GET /suppliers) — the parent
  // form loads them and threads the names in here.
  erps = input<string[]>([]);
  suppliers = input<string[]>([]);
  // Client-role users a project can be assigned to (GET /users?role=client).
  clients = input<UserInterface[]>([]);

  entryModeChange = output<'new' | 'existing'>();
  // Admin-only "+ Add new" actions — the parent form owns the dialog + API
  // call. Client's dialog additionally collects a password (it creates a
  // login account) — see ADD_OPTION_COPY in project-form.component.ts.
  addErpRequested = output<void>();
  addSupplierRequested = output<void>();
  addClientRequested = output<void>();

  readonly existingProjectOptions = computed<SearchDropdownOption[]>(() =>
    this.existingProjects().map((name) => ({ id: name, label: name })),
  );

  readonly erpOptions = computed<SearchDropdownOption[]>(() =>
    this.erps().map((name) => ({ id: name, label: name })),
  );
  readonly supplierOptions = computed<SearchDropdownOption[]>(() =>
    this.suppliers().map((name) => ({ id: name, label: name })),
  );
  readonly clientOptions = computed<SearchDropdownOption[]>(() =>
    this.clients().map((c) => ({ id: c.id, label: c.name, sublabel: c.email })),
  );

  // Employees a project can be assigned to, shaped for the search dropdown.
  // The option id is the user's MongoDB id — what the backend expects as ownerId.
  readonly employeeOptions = computed<SearchDropdownOption[]>(() =>
    this.assignableUsers().map((u) => ({
      id: u.id,
      label: u.name,
      sublabel: u.email,
    })),
  );

  hasError(key: keyof ProjectInterface): boolean {
    return hasError(this.form(), key);
  }
}
