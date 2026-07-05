import { Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/*
 * ──────────────────────────────────────────────────────────────────
 !  Dual-thumb range slider
 *
 *  Two draggable handles pick a low and a high number. The value is
 *  stored as one "min-max" string (e.g. "45-60") — the format the
 *  tentativeRangeDays field expects.
 *
 *  It connects to the form with two pieces:
 *   1. ControlValueAccessor  → HOW the form talks to us
 *      (four standard methods, at the bottom of this file).
 *   2. NG_VALUE_ACCESSOR     → HOW the form finds us
 *      (the registration in `providers` below).
 * ──────────────────────────────────────────────────────────────────
 */
@Component({
  selector: 'app-range-slider',
  standalone: true,
  imports: [],
  templateUrl: './range-slider.component.html',
  styleUrl: './range-slider.component.less',
  providers: [
    /*
     * NG_VALUE_ACCESSOR = how the form FINDS us.
     * formControlName never looks inside our class — it only checks
     * this registration. Without it: "No value accessor" error.
     *
     *  - forwardRef(...) → class is defined further down; look it up later
     *  - useExisting     → reuse this component instance, don't build a new one
     *  - multi: true     → the key holds a list (Angular requires this)
     */
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RangeSliderComponent),
      multi: true,
    },
  ],
})
export class RangeSliderComponent implements ControlValueAccessor {
  /*
   * ──────────────────────────────────────────────────────────────────
   !  Settings passed in from the parent page
   * ──────────────────────────────────────────────────────────────────
   */
  min = input(0); // lowest number a handle can reach
  max = input(150); // highest number a handle can reach
  step = input(1); // how far a handle moves per tick
  unit = input('days'); // label shown next to the numbers

  /*
   * ──────────────────────────────────────────────────────────────────
   !  The component's memory (signals = values the screen reacts to)
   * ──────────────────────────────────────────────────────────────────
   */
  minValue = signal(0); // where the left handle currently sits
  maxValue = signal(60); // where the right handle currently sits
  activeThumb = signal<'min' | 'max' | null>(null); // which handle is being used (for styling)
  disabled = signal(false); // true → whole slider greyed out

  // The two functions the form hands us (see registerOnChange /
  // registerOnTouched below). We call them to report back:
  //   onChange('45-60') → "the range changed"
  //   onTouched()       → "user interacted with me"
  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  /*
   * ──────────────────────────────────────────────────────────────────
   !  Position helpers (number → % across the track, used by CSS)
   * ──────────────────────────────────────────────────────────────────
   */

  // Left handle position as % of the track width.
  minPct(): number {
    return this.pct(this.minValue());
  }

  // Right handle position as % of the track width.
  maxPct(): number {
    return this.pct(this.maxValue());
  }

  // Turns a value like 45 into "how far along the track" (0–100).
  private pct(value: number): number {
    const span = this.max() - this.min();
    return span <= 0 ? 0 : ((value - this.min()) / span) * 100;
  }

  /*
   * ──────────────────────────────────────────────────────────────────
   !  Dragging the handles
   * ──────────────────────────────────────────────────────────────────
   */

  // Left handle moved. Math.min stops it from crossing the right one.
  onMinInput(event: Event): void {
    const val = Number((event.target as HTMLInputElement).value);
    this.minValue.set(Math.min(val, this.maxValue()));
    this.emit();
  }

  // Right handle moved. Math.max stops it from crossing the left one.
  onMaxInput(event: Event): void {
    const val = Number((event.target as HTMLInputElement).value);
    this.maxValue.set(Math.max(val, this.minValue()));
    this.emit();
  }

  // Remember which handle is in use so CSS can style it as active.
  onThumbActive(thumb: 'min' | 'max'): void {
    this.activeThumb.set(thumb);
  }

  // Handle released → tell the form "user interacted with me".
  onThumbBlur(): void {
    this.onTouched();
  }

  // Join the two numbers into "45-60" and report it to the form.
  private emit(): void {
    this.onChange(`${this.minValue()}-${this.maxValue()}`);
  }

  /*
   * ──────────────────────────────────────────────────────────────────
   !  ControlValueAccessor = how the form TALKS to us.
   *  Four standard methods every form input must have.
   *  The form calls them — we never call them ourselves.
   * ──────────────────────────────────────────────────────────────────
   */

  // Form → us: "display this value", e.g. "45-60" → handles at 45 and 60.
  // No saved value yet → start at min and the middle of the track.
  writeValue(value: string | null): void {
    if (!value) {
      this.minValue.set(this.min());
      this.maxValue.set(Math.round((this.min() + this.max()) / 2));
      return;
    }
    const [minStr, maxStr] = value.split('-');
    const parsedMin = Number(minStr);
    const parsedMax = Number(maxStr);
    if (!isNaN(parsedMin)) this.minValue.set(parsedMin);
    if (!isNaN(parsedMax)) this.maxValue.set(parsedMax);
  }

  // Form → us: "call fn whenever your value changes" (we do, while dragging).
  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  // Form → us: "call fn once the user has interacted with you".
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  // Form → us: "grey yourself out" (or back in).
  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }
}
