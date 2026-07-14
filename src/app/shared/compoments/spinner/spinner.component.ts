import { Component, input } from '@angular/core';

/*
 * ──────────────────────────────────────────────────────────────────
 !  Branded loading spinner — two counter-rotating golden arcs around
 *  a pulsing core, with an optional label/sublabel underneath.
 *
 *  Use it inside any content area that is empty while an API call
 *  runs (lists, the edit form, …). The slim top loading-bar tracks
 *  every request globally; this fills the space the data will occupy.
 *
 *    <app-spinner label="Loading projects…" sublabel="Fetching the latest data" />
 * ──────────────────────────────────────────────────────────────────
 */
@Component({
  selector: 'app-spinner',
  standalone: true,
  templateUrl: './spinner.component.html',
  styleUrl: './spinner.component.less',
})
export class SpinnerComponent {
  label = input('');
  sublabel = input('');
  // 'lg' fills a page section; 'sm' fits inside dialogs / tight blocks.
  size = input<'sm' | 'lg'>('lg');
}
