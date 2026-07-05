import { Component, computed, input, output } from '@angular/core';

// Allowed visual styles for the button
export type ButtonVariant = 'primary' | 'link';

// Allowed native button types
export type ButtonType = 'button' | 'submit' | 'reset';

@Component({
  selector: 'app-button',
  imports: [],
  templateUrl: './button.html',
  styleUrl: './button.less',
})
export class ButtonComponent {
  /*
   * ──────────────────────────────────────────────────────────────────
   !  Inputs — settings the parent screen can pass in
   * ──────────────────────────────────────────────────────────────────
   */

  label = input.required<string>(); //Text shown on the button. Required.

  variant = input<ButtonVariant>('primary'); //Visual style of the button. Defaults to 'primary'.

  type = input<ButtonType>('button'); //Native button type. Defaults to 'button'.

  disabled = input(false); //Disables the button when true. Defaults to false.

  loading = input(false);

  loadingLabel = input(''); //Optional text shown instead of `label` while loading.

  fullWidth = input(true);

  showBackArrow = input(false);

  /*
   * ──────────────────────────────────────────────────────────────────
   !  Outputs — events sent back to the parent screen
   * ──────────────────────────────────────────────────────────────────
   */

  // emitted when the button is clicked (and not disabled/loading)
  clicked = output<void>();

  /*
   * ──────────────────────────────────────────────────────────────────
   !  Computed values — derived from the inputs above
   * ──────────────────────────────────────────────────────────────────
   */

  // true when explicitly disabled or while loading
  isDisabled = computed(() => this.disabled() || this.loading());

  // shows loadingLabel while loading (falls back to label), otherwise label
  displayLabel = computed(() =>
    this.loading() ? this.loadingLabel() || this.label() : this.label(),
  );

  // ── Event handlers ───────────────────────────────────────────────────

  onClick(): void {
    if (this.isDisabled()) {
      return;
    }

    this.clicked.emit();
  }
}
