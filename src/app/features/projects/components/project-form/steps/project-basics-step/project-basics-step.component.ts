import { Component, computed, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ProjectInterface } from '../../../../../../core/intefaces/form/project.interface';
import { UserInterface } from '../../../../../../core/intefaces/user-interface';
import { hasError } from '../../../../../../core/utils/form-control.util';
import { ERP_SYSTEMS, SUPPLIERS } from '../../../../../../core/data/static-erp-suppliers.data';
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

  entryModeChange = output<'new' | 'existing'>();
  existingProjectPicked = output<string>();

  // Fixed pick-lists — same options every time, so this component owns them
  // directly rather than the parent form threading them in.
  readonly erpOptions: SearchDropdownOption[] = ERP_SYSTEMS.map((name) => ({
    id: name,
    label: name,
  }));
  readonly supplierOptions: SearchDropdownOption[] = SUPPLIERS.map((name) => ({
    id: name,
    label: name,
  }));

  // Employees a project can be assigned to, shaped for the search dropdown.
  readonly employeeOptions = computed<SearchDropdownOption[]>(() =>
    this.assignableUsers().map((u) => ({
      id: u.username,
      label: u.fullName || u.username,
      sublabel: `@${u.username}`,
    })),
  );

  hasError(key: keyof ProjectInterface): boolean {
    return hasError(this.form(), key);
  }

  onProjectPicked(event: Event): void {
    const name = (event.target as HTMLSelectElement).value;
    if (name) this.existingProjectPicked.emit(name);
  }
}
