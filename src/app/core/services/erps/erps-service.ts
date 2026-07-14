import { Service, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { API_BASE_URL } from '../../config/api.config';
import { ApiErp, ApiResponse, toApiError } from '../../intefaces/api.interface';

/*
 * ──────────────────────────────────────────────────────────────────
 !  ERP pick-list backed by GET /erps.
 *
 *  Feeds the estimation form's "ERP System" dropdown. Readable by
 *  every logged-in user; the list itself is managed by admins via
 *  the API (POST/DELETE /erps).
 * ──────────────────────────────────────────────────────────────────
 */
@Service()
export class ErpsService {
  private http = inject(HttpClient);

  readonly erps = signal<string[]>([]);
  readonly loading = signal(false);
  readonly loadError = signal('');

  load(): void {
    if (this.loading()) return;
    this.loading.set(true);
    this.loadError.set('');

    this.http.get<ApiResponse<{ erps: ApiErp[] }>>(`${API_BASE_URL}/erps`).subscribe({
      next: (res) => {
        this.erps.set(res.data.erps.map((e) => e.name));
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.loadError.set(toApiError(err, 'Could not load ERP systems.').message);
      },
    });
  }

  /** Admin only (enforced by the API). Adds the option and updates the list. */
  create(name: string): Observable<string> {
    return this.http
      .post<ApiResponse<{ erp: ApiErp }>>(`${API_BASE_URL}/erps`, { name })
      .pipe(
        map((res) => {
          const created = res.data.erp.name;
          this.erps.update((list) => [...list, created].sort((a, b) => a.localeCompare(b)));
          return created;
        }),
        catchError((err: unknown) =>
          throwError(() => toApiError(err, 'Could not add the ERP system.')),
        ),
      );
  }
}
