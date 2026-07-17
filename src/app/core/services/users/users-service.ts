import { Service, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { API_BASE_URL } from '../../config/api.config';
import { ApiResponse, ApiUser, toApiError } from '../../intefaces/api.interface';
import { UserInterface } from '../../intefaces/user-interface';
import { mapApiUser } from '../auth/auth-service';

export interface CreateEmployeeInput {
  name: string;
  email: string;
  password: string;
  jobTitle?: string;
  department?: string;
}

export interface UpdateEmployeeInput {
  name?: string;
  email?: string;
  password?: string;
  jobTitle?: string;
  department?: string;
}

/*
 * ──────────────────────────────────────────────────────────────────
 !  Employee directory backed by GET /users (admin-only endpoint).
 *
 *  Feeds the admin Employees page and every "assigned to" dropdown/
 *  chip. Only load() from admin screens — the backend rejects the
 *  call for regular users.
 * ──────────────────────────────────────────────────────────────────
 */
@Service()
export class UsersService {
  private http = inject(HttpClient);

  // Employees a project can be assigned/reassigned to — everyone with the User role.
  readonly assignableUsers = signal<UserInterface[]>([]);
  readonly loading = signal(false);
  readonly loadError = signal('');

  load(): void {
    if (this.loading()) return;
    this.loading.set(true);
    this.loadError.set('');

    this.http
      .get<ApiResponse<{ users: ApiUser[] }>>(`${API_BASE_URL}/users`, {
        params: { role: 'user', limit: 100 },
      })
      .subscribe({
        next: (res) => {
          this.assignableUsers.set(res.data.users.map(mapApiUser));
          this.loading.set(false);
        },
        error: (err: unknown) => {
          this.loading.set(false);
          this.loadError.set(toApiError(err, 'Could not load employees.').message);
        },
      });
  }

  /** Admin only (enforced by the API). Creates a role="user" account and adds it to the directory. */
  create(input: CreateEmployeeInput): Observable<UserInterface> {
    return this.http.post<ApiResponse<{ user: ApiUser }>>(`${API_BASE_URL}/users`, input).pipe(
      map((res) => {
        const created = mapApiUser(res.data.user);
        this.assignableUsers.update((list) =>
          [...list, created].sort((a, b) => a.name.localeCompare(b.name)),
        );
        return created;
      }),
      catchError((err: unknown) =>
        throwError(() => toApiError(err, 'Could not add the employee.')),
      ),
    );
  }

  /** Admin only (enforced by the API). Partial update — only fields present in `patch` change. */
  update(id: string, patch: UpdateEmployeeInput): Observable<UserInterface> {
    return this.http.patch<ApiResponse<{ user: ApiUser }>>(`${API_BASE_URL}/users/${id}`, patch).pipe(
      map((res) => {
        const updated = mapApiUser(res.data.user);
        this.assignableUsers.update((list) =>
          list.map((u) => (u.id === id ? updated : u)).sort((a, b) => a.name.localeCompare(b.name)),
        );
        return updated;
      }),
      catchError((err: unknown) =>
        throwError(() => toApiError(err, 'Could not update the employee.')),
      ),
    );
  }
}
