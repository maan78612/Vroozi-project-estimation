import { Service, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { API_BASE_URL } from '../../config/api.config';
import { ApiAuthData, ApiResponse, ApiUser, toApiError } from '../../intefaces/api.interface';
import { UserInterface } from '../../intefaces/user-interface';
import { RoleEnum } from '../../enums/role-enum';
import { SessionService } from '../session/session-service';

/** Maps a backend user document to the app's UserInterface. */
export function mapApiUser(user: ApiUser): UserInterface {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    clientCompany: user.clientCompany,
    jobTitle: user.jobTitle,
    department: user.department,
  };
}

/*
 * ──────────────────────────────────────────────────────────────────
 !  Authentication against the backend API (POST /auth/login).
 *
 *  The JWT + user live in SessionService (in memory only — a page
 *  refresh ends the session). The HTTP interceptor attaches the
 *  token to every request and drops the session on 401.
 * ──────────────────────────────────────────────────────────────────
 */
@Service()
export class AuthService {
  private http = inject(HttpClient);
  private session = inject(SessionService);

  login(email: string, password: string): Observable<UserInterface> {
    return this.http
      .post<ApiResponse<ApiAuthData>>(`${API_BASE_URL}/auth/login`, { email, password })
      .pipe(
        map((res) => {
          const user = mapApiUser(res.data.user);
          this.session.store(res.data.token, user);
          return user;
        }),
        catchError((err: unknown) =>
          throwError(() => toApiError(err, 'Login failed. Please try again.')),
        ),
      );
  }

  /** Re-fetches the signed-in user from GET /auth/me (fresh role/name). */
  me(): Observable<UserInterface> {
    return this.http.get<ApiResponse<{ user: ApiUser }>>(`${API_BASE_URL}/auth/me`).pipe(
      map((res) => {
        const user = mapApiUser(res.data.user);
        this.session.setUser(user);
        return user;
      }),
      catchError((err: unknown) =>
        throwError(() => toApiError(err, 'Could not load your account.')),
      ),
    );
  }

  logout(): void {
    this.session.clear();
  }

  isAuthenticated(): boolean {
    return this.session.getUser() !== null;
  }

  getRole(): RoleEnum | null {
    return this.session.getUser()?.role ?? null;
  }

  getCurrentUser(): UserInterface | null {
    return this.session.getUser();
  }
}
