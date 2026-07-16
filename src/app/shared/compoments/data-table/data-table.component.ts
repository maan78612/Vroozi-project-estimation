import { Component, input } from '@angular/core';
import { SpinnerComponent } from '../spinner/spinner.component';

/*
 * ──────────────────────────────────────────────────────────────────
 !  Table chrome only — scroll container, loading state, empty state.
 *  The actual <table> markup (thead/tbody) is written by the
 *  consuming page and projected in, styled by the global `.app-table`
 *  utility classes in styles.less (content projection doesn't cross
 *  Angular's view-encapsulation boundary, so table styles have to
 *  live globally rather than in this component's own stylesheet).
 *
 *  Deliberately not a data-driven grid (columns/rows as inputs) —
 *  the two real consumers (Employees, Clients) have different
 *  columns and there's no third consumer yet to justify that.
 * ──────────────────────────────────────────────────────────────────
 */
@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [SpinnerComponent],
  templateUrl: './data-table.component.html',
  styleUrl: './data-table.component.less',
})
export class DataTableComponent {
  loading = input(false);
  empty = input(false);
  emptyIcon = input('inbox');
  emptyTitle = input('No results');
  emptyMessage = input('');
  // Strips the outer glass-surface card — used when a parent page wants
  // one unified card around a controls row + table + pagination together
  // (Clients, Employees) instead of the table owning its own card.
  bare = input(false);
}
