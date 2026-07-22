import { Component, input, output } from '@angular/core';
import { ButtonComponent } from '../button/button';
import { AppLogoComponent } from '../app-logo/app-logo.component';

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
  imports: [ButtonComponent, AppLogoComponent],
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.less',
  host: {
    '(document:keydown.escape)': 'onCancel()',
    // The `title` input shares its name with the native title attribute, so a
    // static `title="…"` at a call site would linger in the DOM and show up as
    // a browser tooltip on hover — strip it from the host element.
    '[attr.title]': 'null',
  },
})
export class ConfirmDialogComponent {
  title = input.required<string>();
  message = input.required<string>();
  confirmLabel = input('Delete');
  cancelLabel = input('Cancel');
  // Defaults preserve the original destructive-confirm look for every
  // existing call site — only a caller that opts in (e.g. a non-destructive
  // confirmation) needs to pass these.
  danger = input(true);
  loadingLabel = input('Deleting…');
  confirming = input(false);
  errorMessage = input('');
  // False turns this into a single-button "acknowledge" dialog (e.g. an
  // informational notice with just an "OK") — the Cancel button and its
  // `cancelled` output stop rendering/firing, so there's nothing to wire
  // up beyond `confirmed` at call sites that opt in.
  showCancel = input(true);
  // Off by default — a brand mark reads as decoration on a "delete this?"
  // prompt. Opt in for the friendlier, non-destructive dialogs (e.g. an
  // account-created notice) where it's a nice touch instead of noise.
  showLogo = input(false);

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
