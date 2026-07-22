import { Service, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { API_BASE_URL } from '../../config/api.config';
import { ApiResponse, ApiUser, toApiError } from '../../intefaces/api.interface';
import { UserInterface } from '../../intefaces/user-interface';
import { mapApiUser } from '../auth/auth-service';
import { fetchAllPages } from '../../utils/fetch-all-pages.util';

export interface CreateClientUserInput {
  name: string;
  email: string;
}

export interface UpdateClientUserInput {
  name?: string;
  email?: string;
  password?: string;
}

/*
 * ──────────────────────────────────────────────────────────────────
 !  Client-user directory backed by GET /users?role=client.
 *
 *  A client is just a role="client" User (a real login account, same
 *  as an employee) — this feeds the admin Clients Directory page
 *  (full CRUD) and the estimation form's "Client" picker (a project
 *  is directly assigned to one client user, the same way it's
 *  assigned to one employee via `user`).
 * ──────────────────────────────────────────────────────────────────
 */
@Service()
export class ClientUsersService {
  private http = inject(HttpClient);

  readonly clientUsers = signal<UserInterface[]>([]);
  readonly loading = signal(false);
  readonly loadError = signal('');

  load(): void {
    if (this.loading()) return;
    this.loading.set(true);
    this.loadError.set('');

    fetchAllPages<ApiUser>((page) =>
      this.http
        .get<ApiResponse<{ users: ApiUser[] }>>(`${API_BASE_URL}/users`, {
          params: { role: 'client', limit: 100, page },
        })
        .pipe(map((res) => ({ items: res.data.users, meta: res.meta }))),
    ).subscribe({
      next: (users) => {
        this.clientUsers.set(users.map(mapApiUser));
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.loadError.set(toApiError(err, 'Could not load clients.').message);
      },
    });
  }

  /** Admin only (enforced by the API). Creates a role="client" account and adds it to the directory. */
  create(input: CreateClientUserInput): Observable<UserInterface> {
    return this.http
      .post<ApiResponse<{ user: ApiUser }>>(`${API_BASE_URL}/users`, { ...input, role: 'client' })
      .pipe(
        map((res) => {
          const created = mapApiUser(res.data.user);
          this.clientUsers.update((list) =>
            [...list, created].sort((a, b) => a.name.localeCompare(b.name)),
          );
          return created;
        }),
        catchError((err: unknown) =>
          throwError(() => toApiError(err, 'Could not add the client.')),
        ),
      );
  }

  /** Admin only (enforced by the API). Partial update — only fields present in `patch` change. */
  update(id: string, patch: UpdateClientUserInput): Observable<UserInterface> {
    return this.http.patch<ApiResponse<{ user: ApiUser }>>(`${API_BASE_URL}/users/${id}`, patch).pipe(
      map((res) => {
        const updated = mapApiUser(res.data.user);
        this.clientUsers.update((list) =>
          list.map((c) => (c.id === id ? updated : c)).sort((a, b) => a.name.localeCompare(b.name)),
        );
        return updated;
      }),
      catchError((err: unknown) =>
        throwError(() => toApiError(err, 'Could not update the client.')),
      ),
    );
  }

  /** Admin only (enforced by the API). Soft delete — removes the account from the directory. */
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/users/${id}`).pipe(
      map(() => {
        this.clientUsers.update((list) => list.filter((c) => c.id !== id));
      }),
      catchError((err: unknown) =>
        throwError(() => toApiError(err, 'Could not delete the client.')),
      ),
    );
  }
}
