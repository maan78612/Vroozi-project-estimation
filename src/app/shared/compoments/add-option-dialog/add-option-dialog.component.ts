import { Component, input, output, signal } from '@angular/core';
import { ButtonComponent } from '../button/button';
import { AutofocusDirective } from '../../directives/autofocus.directive';

/*
 * ──────────────────────────────────────────────────────────────────
 !  Small "add an option" dialog — one text field + Save.
 *
 *  Used by the project form to let an admin add a new ERP system or
 *  Supplier to the pick-lists without leaving the wizard. The parent
 *  owns the actual API call: it listens to (save), flips `saving`
 *  while the request runs, and passes `errorMessage` if it fails —
 *  the dialog only closes when the parent decides it succeeded.
 *
 *  Closes on ×, Cancel, backdrop click, or Escape; none of those
 *  fire while `saving` is true so an in-flight request can't be
 *  dismissed.
 * ──────────────────────────────────────────────────────────────────
 */
@Component({
  selector: 'app-add-option-dialog',
  standalone: true,
  imports: [ButtonComponent, AutofocusDirective],
  templateUrl: './add-option-dialog.component.html',
  styleUrl: './add-option-dialog.component.less',
  host: { '(document:keydown.escape)': 'onCancel()' },
})
export class AddOptionDialogComponent {
  eyebrow = input('New option');
  title = input.required<string>();
  subtitle = input('');
  label = input('Name');
  placeholder = input('Enter a name…');
  saving = input(false);
  errorMessage = input('');

  save = output<string>();
  cancelled = output<void>();

  readonly name = signal('');

  onSubmit(): void {
    const name = this.name().trim();
    if (!name || this.saving()) return;
    this.save.emit(name);
  }

  onBackdropClick(): void {
    this.onCancel();
  }

  onCancel(): void {
    if (this.saving()) return;
    this.cancelled.emit();
  }
}
