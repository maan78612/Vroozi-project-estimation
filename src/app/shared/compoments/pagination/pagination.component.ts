import { Component, computed, input, output } from '@angular/core';

/*
 * ──────────────────────────────────────────────────────────────────
 !  Presentational pager — purely controlled by the parent, same
 *  pattern project-filter-bar already uses for its own state
 *  (inputs in, change events out, no internal page state here).
 * ──────────────────────────────────────────────────────────────────
 */
@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [],
  templateUrl: './pagination.component.html',
  styleUrl: './pagination.component.less',
})
export class PaginationComponent {
  page = input.required<number>(); // 1-indexed current page
  totalPages = input.required<number>();

  pageChange = output<number>();

  readonly canGoPrevious = computed(() => this.page() > 1);
  readonly canGoNext = computed(() => this.page() < this.totalPages());

  // Page numbers to render, with -1 standing in for an ellipsis —
  // always shows first, last, and up to 1 neighbor on each side of
  // the current page.
  readonly visiblePages = computed<number[]>(() => {
    const total = this.totalPages();
    const current = this.page();
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const pages = new Set<number>([1, total, current]);
    if (current - 1 > 1) pages.add(current - 1);
    if (current + 1 < total) pages.add(current + 1);

    const sorted = [...pages].sort((a, b) => a - b);
    const withEllipsis: number[] = [];
    sorted.forEach((p, i) => {
      if (i > 0 && p - sorted[i - 1] > 1) withEllipsis.push(-1);
      withEllipsis.push(p);
    });
    return withEllipsis;
  });

  goTo(target: number): void {
    if (target < 1 || target > this.totalPages() || target === this.page()) return;
    this.pageChange.emit(target);
  }

  previous(): void {
    this.goTo(this.page() - 1);
  }

  next(): void {
    this.goTo(this.page() + 1);
  }
}
