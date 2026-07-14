import { Service, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { API_BASE_URL } from '../../config/api.config';
import { ApiResponse, ApiSupplier, toApiError } from '../../intefaces/api.interface';

/*
 * ──────────────────────────────────────────────────────────────────
 !  Supplier pick-list backed by GET /suppliers.
 *
 *  Feeds the estimation form's "Supplier" dropdown. Readable by
 *  every logged-in user; the list itself is managed by admins via
 *  the API (POST/DELETE /suppliers).
 * ──────────────────────────────────────────────────────────────────
 */
@Service()
export class SuppliersService {
  private http = inject(HttpClient);

  readonly suppliers = signal<string[]>([]);
  readonly loading = signal(false);
  readonly loadError = signal('');

  load(): void {
    if (this.loading()) return;
    this.loading.set(true);
    this.loadError.set('');

    this.http
      .get<ApiResponse<{ suppliers: ApiSupplier[] }>>(`${API_BASE_URL}/suppliers`)
      .subscribe({
        next: (res) => {
          this.suppliers.set(res.data.suppliers.map((s) => s.name));
          this.loading.set(false);
        },
        error: (err: unknown) => {
          this.loading.set(false);
          this.loadError.set(toApiError(err, 'Could not load suppliers.').message);
        },
      });
  }

  /** Admin only (enforced by the API). Adds the option and updates the list. */
  create(name: string): Observable<string> {
    return this.http
      .post<ApiResponse<{ supplier: ApiSupplier }>>(`${API_BASE_URL}/suppliers`, { name })
      .pipe(
        map((res) => {
          const created = res.data.supplier.name;
          this.suppliers.update((list) =>
            [...list, created].sort((a, b) => a.localeCompare(b)),
          );
          return created;
        }),
        catchError((err: unknown) =>
          throwError(() => toApiError(err, 'Could not add the supplier.')),
        ),
      );
  }
}
