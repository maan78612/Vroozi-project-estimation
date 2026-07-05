import { Component, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ProjectInterface } from '../../../../../../core/intefaces/form/project.interface';
import { UserInterface } from '../../../../../../core/intefaces/user-interface';
import { hasError } from '../../../../../../core/utils/form-control.util';
import { EmployeeSelectComponent } from '../../../../../../shared/compoments/employee-select/employee-select.component';

/*
 * ──────────────────────────────────────────────────────────────────
 !  Step 1 — pick what you're adding, then the basics
 *
 *  Create mode starts with a choice: brand-new project, or another
 *  supplier for an existing project (picked from a dropdown). Each
 *  saved entry is one supplier row with its own data.
 * ──────────────────────────────────────────────────────────────────
 */
@Component({
  selector: 'app-project-basics-step',
  standalone: true,
  imports: [ReactiveFormsModule, EmployeeSelectComponent],
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

  hasError(key: keyof ProjectInterface): boolean {
    return hasError(this.form(), key);
  }

  onProjectPicked(event: Event): void {
    const name = (event.target as HTMLSelectElement).value;
    if (name) this.existingProjectPicked.emit(name);
  }
}
