import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { finalize } from 'rxjs';
import { LoadingService } from '../services/loading/loading-service';

/*
 * ──────────────────────────────────────────────────────────────────
 !  Counts every HTTP request in/out so the global loading bar knows
 *  when the app is talking to the API — no component has to remember
 *  to flip a flag. `finalize` runs on success, error, AND cancel, so
 *  the counter can never get stuck.
 * ──────────────────────────────────────────────────────────────────
 */
export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loading = inject(LoadingService);

  loading.start();
  return next(req).pipe(finalize(() => loading.stop()));
};
