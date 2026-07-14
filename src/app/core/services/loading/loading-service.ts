import { Service, computed, signal } from '@angular/core';

/*
 * ──────────────────────────────────────────────────────────────────
 !  Global API activity tracker.
 *
 *  The loading interceptor bumps the counter for every in-flight
 *  HTTP request; the top loading bar (see shared/loading-bar) shows
 *  whenever at least one request is running. A counter — not a
 *  boolean — so overlapping requests can't switch the bar off early.
 * ──────────────────────────────────────────────────────────────────
 */
@Service()
export class LoadingService {
  private pending = signal(0);

  readonly isLoading = computed(() => this.pending() > 0);

  start(): void {
    this.pending.update((n) => n + 1);
  }

  stop(): void {
    this.pending.update((n) => Math.max(0, n - 1));
  }
}
