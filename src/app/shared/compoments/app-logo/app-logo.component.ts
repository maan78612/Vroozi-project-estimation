import { Component, computed, input } from '@angular/core';

/*
 * ──────────────────────────────────────────────────────────────────
 !  Sherlock Holmes brand mark, traced from the source artwork and
 *  flattened to `currentColor` so it tints via `--color-primary`
 *  across the light/dark theme instead of needing per-theme assets.
 *  Both viewBoxes are tight crops (measured via getBBox against the
 *  actual paths, not the full 1024x1024 canvas). `size` sets the
 *  rendered height; width is derived from the viewBox's own aspect
 *  ratio (rather than forcing a square box) so the element's edges
 *  hug the artwork exactly — a square box around non-square content
 *  letterboxes, adding invisible padding that reads as a gap between
 *  the mark and whatever sits below it. `iconOnly` drops the
 *  wordmark band for compact horizontal placements like the app
 *  shell header.
 * ──────────────────────────────────────────────────────────────────
 */
const FULL_VIEWBOX = { x: 84, y: 148, width: 856, height: 730 };
const ICON_VIEWBOX = { x: 285, y: 148, width: 454, height: 581 };

@Component({
  selector: 'app-logo',
  standalone: true,
  templateUrl: './app-logo.component.html',
  styleUrl: './app-logo.component.less',
})
export class AppLogoComponent {
  size = input(32);
  iconOnly = input(false);

  private readonly box = computed(() => (this.iconOnly() ? ICON_VIEWBOX : FULL_VIEWBOX));

  readonly viewBox = computed(() => {
    const b = this.box();
    return `${b.x} ${b.y} ${b.width} ${b.height}`;
  });
  readonly heightPx = computed(() => `${this.size()}px`);
  readonly widthPx = computed(() => {
    const b = this.box();
    return `${(this.size() * b.width) / b.height}px`;
  });
}
