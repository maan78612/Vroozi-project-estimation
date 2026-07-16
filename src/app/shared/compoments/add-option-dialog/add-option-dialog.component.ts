import { Component, input, output } from '@angular/core';
import { FormComponent } from '../form/form.component';
import { ButtonComponent } from '../button/button';
import { FormFieldInterface } from '../../../core/intefaces/form/form-field.interface';

/*
 * ──────────────────────────────────────────────────────────────────
 !  Small modal shell around <app-form> — backdrop, panel, header
 *  (eyebrow/title/subtitle/close), nothing else of its own; field
 *  rendering and validation are entirely <app-form>'s job.
 *
 *  Originally a single hardcoded text field (still is, for the ERP/
 *  Supplier/Client-Company "+ Add new" pick-list flows); generalized
 *  to accept any FormFieldInterface[] so the Clients and Employees
 *  "Add"/"Edit" dialogs can reuse this chrome instead of a third
 *  hand-rolled modal.
 *
 *  The parent owns the actual API call: it listens to (save), flips
 *  `saving` while the request runs, and passes `errorMessage` if it
 *  fails — the dialog only closes when the parent decides it succeeded.
 *
 *  Closes on ×, Cancel, backdrop click, or Escape; none of those
 *  fire while `saving` is true so an in-flight request can't be
 *  dismissed.
 * ──────────────────────────────────────────────────────────────────
 */
@Component({
  selector: 'app-add-option-dialog',
  standalone: true,
  imports: [FormComponent, ButtonComponent],
  templateUrl: './add-option-dialog.component.html',
  styleUrl: './add-option-dialog.component.less',
  host: { '(document:keydown.escape)': 'onCancel()' },
})
export class AddOptionDialogComponent {
  eyebrow = input('New option');
  title = input.required<string>();
  subtitle = input('');
  fields = input.required<FormFieldInterface[]>();
  initialValue = input<Record<string, string | number>>({});
  submitLabel = input('Save');
  saving = input(false);
  errorMessage = input('');

  save = output<Record<string, string | number>>();
  cancelled = output<void>();

  onBackdropClick(): void {
    this.onCancel();
  }

  onCancel(): void {
    if (this.saving()) return;
    this.cancelled.emit();
  }
}
