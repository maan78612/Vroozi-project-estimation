import { Component, input, output } from '@angular/core';
import { ButtonComponent } from '../button/button';

/*
 * ──────────────────────────────────────────────────────────────────
 !  Generic "are you sure?" dialog — used before destructive actions
 *
 *  Closes on Cancel, backdrop click, or Escape; none of those fire
 *  while `confirming` is true so an in-flight delete can't be
 *  dismissed mid-request.
 * ──────────────────────────────────────────────────────────────────
 */
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [ButtonComponent],
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.less',
  host: { '(document:keydown.escape)': 'onCancel()' },
})
export class ConfirmDialogComponent {
  title = input.required<string>();
  message = input.required<string>();
  confirmLabel = input('Delete');
  cancelLabel = input('Cancel');
  confirming = input(false);
  errorMessage = input('');

  confirmed = output<void>();
  cancelled = output<void>();

  onBackdropClick(): void {
    this.onCancel();
  }

  onCancel(): void {
    if (this.confirming()) return;
    this.cancelled.emit();
  }
}
