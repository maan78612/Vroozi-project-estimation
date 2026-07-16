import { Service, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { API_BASE_URL } from '../../config/api.config';
import { ApiClientCompany, ApiResponse, toApiError } from '../../intefaces/api.interface';

/*
 * ──────────────────────────────────────────────────────────────────
 !  Client company pick-list backed by GET /client-companies.
 *
 *  Feeds the estimation form's "Client Company" dropdown (admin-only
 *  field) via `names` below, and backs the admin Clients Directory
 *  page (create/delete) via the full `clientCompanies` signal, which
 *  keeps the `_id` the delete endpoint needs. Mirrors erps-service.ts
 *  / suppliers-service.ts, plus the delete() those don't need yet.
 * ──────────────────────────────────────────────────────────────────
 */
@Service()
export class ClientCompaniesService {
  private http = inject(HttpClient);

  readonly clientCompanies = signal<ApiClientCompany[]>([]);
  readonly loading = signal(false);
  readonly loadError = signal('');

  // Flat name list — what the estimation form's picker actually needs.
  readonly names = computed(() => this.clientCompanies().map((c) => c.name));

  load(): void {
    if (this.loading()) return;
    this.loading.set(true);
    this.loadError.set('');

    this.http
      .get<ApiResponse<{ clientCompanies: ApiClientCompany[] }>>(
        `${API_BASE_URL}/client-companies`,
      )
      .subscribe({
        next: (res) => {
          this.clientCompanies.set(res.data.clientCompanies);
          this.loading.set(false);
        },
        error: (err: unknown) => {
          this.loading.set(false);
          this.loadError.set(toApiError(err, 'Could not load client companies.').message);
        },
      });
  }

  /** Admin only (enforced by the API). Adds the option and updates the list. */
  create(name: string, email?: string, primaryContact?: string): Observable<string> {
    return this.http
      .post<ApiResponse<{ clientCompany: ApiClientCompany }>>(
        `${API_BASE_URL}/client-companies`,
        { name, email, primaryContact },
      )
      .pipe(
        map((res) => {
          const created = res.data.clientCompany;
          this.clientCompanies.update((list) =>
            [...list, created].sort((a, b) => a.name.localeCompare(b.name)),
          );
          return created.name;
        }),
        catchError((err: unknown) =>
          throwError(() => toApiError(err, 'Could not add the client company.')),
        ),
      );
  }

  /** Admin only (enforced by the API). Partial update — only fields present in `patch` change. */
  update(
    id: string,
    patch: { name?: string; email?: string; primaryContact?: string },
  ): Observable<ApiClientCompany> {
    return this.http
      .patch<ApiResponse<{ clientCompany: ApiClientCompany }>>(
        `${API_BASE_URL}/client-companies/${id}`,
        patch,
      )
      .pipe(
        map((res) => {
          const updated = res.data.clientCompany;
          this.clientCompanies.update((list) =>
            list
              .map((c) => (c._id === id ? updated : c))
              .sort((a, b) => a.name.localeCompare(b.name)),
          );
          return updated;
        }),
        catchError((err: unknown) =>
          throwError(() => toApiError(err, 'Could not update the client company.')),
        ),
      );
  }

  /** Admin only (enforced by the API). Soft delete — removes it from the pick-list. */
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/client-companies/${id}`).pipe(
      map(() => {
        this.clientCompanies.update((list) => list.filter((c) => c._id !== id));
      }),
      catchError((err: unknown) =>
        throwError(() => toApiError(err, 'Could not delete the client company.')),
      ),
    );
  }
}
