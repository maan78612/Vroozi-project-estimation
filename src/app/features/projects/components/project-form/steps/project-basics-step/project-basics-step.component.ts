import { Component, computed, input, output, signal } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ProjectInterface, ProjectScope } from '../../../../../../core/intefaces/form/project.interface';
import { BrdCoverage } from '../../../../../../core/intefaces/api.interface';
import { UserInterface } from '../../../../../../core/intefaces/user-interface';
import { FeatureFlagInterface } from '../../../../../../core/intefaces/form/feature-flag.interface';
import { hasError, yn, setYn } from '../../../../../../core/utils/form-control.util';
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

  // BRD auto-fill — the parent form owns the API call and patches steps
  // 2-4 with the returned suggestions; this step only hosts the upload UI.
  brdAnalyzing = input(false);
  brdError = input('');
  brdSummary = input('');
  // 'full' → success card, 'partial' → warning card, 'none' → failure card.
  brdCoverage = input<BrdCoverage | ''>('');

  entryModeChange = output<'new' | 'existing'>();
  // Admin-only "+ Add new" actions — the parent form owns the dialog + API
  // call. Client's dialog additionally collects a password (it creates a
  // login account) — see ADD_OPTION_COPY in project-form.component.ts.
  addErpRequested = output<void>();
  addSupplierRequested = output<void>();
  addClientRequested = output<void>();
  brdFileSelected = output<File>();

  readonly brdFileName = signal('');

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

  // EDI — drives whether Supplier is required (see project-form.component.ts's applySupplierValidator).
  yn(key: FeatureFlagInterface['key']): 'Yes' | 'No' {
    return yn(this.form(), key);
  }

  setEdi(val: 'Yes' | 'No'): void {
    setYn(this.form(), 'edi', val);
  }

  // Internal / External project scope — set once, alongside Project Name.
  isScope(scope: ProjectScope): boolean {
    return this.form().get('projectScope')?.value === scope;
  }

  setScope(scope: ProjectScope): void {
    this.form().get('projectScope')?.setValue(scope);
  }

  brdResultTitle(): string {
    switch (this.brdCoverage()) {
      case 'partial':
        return 'Partial analysis';
      case 'none':
        return 'No scoping data found';
      default:
        return 'AI analysis complete';
    }
  }

  brdResultNote(): string {
    switch (this.brdCoverage()) {
      case 'partial':
        return 'Some fields weren’t found in the document and were set conservatively — double-check Steps 2–4 before submitting.';
      case 'none':
        return 'This document didn’t contain usable scoping information — Steps 2–4 were left at conservative defaults.';
      default:
        return 'Steps 2–4 were pre-filled from the document — review and adjust before submitting.';
    }
  }

  onBrdFileChange(event: Event): void {
    const inputEl = event.target as HTMLInputElement;
    const file = inputEl.files?.[0];
    // Reset so picking the same file again re-fires the change event.
    inputEl.value = '';
    if (!file || this.brdAnalyzing()) return;
    this.brdFileName.set(file.name);
    this.brdFileSelected.emit(file);
  }
}
