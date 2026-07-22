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
    jobTitle: user.jobTitle,
    department: user.department,
  };
}

/*
 * ──────────────────────────────────────────────────────────────────
 !  Authentication against the backend API (POST /auth/login).
 *
 *  The JWT + user live in SessionService (persisted to localStorage,
 *  so a refresh keeps the session alive). The HTTP interceptor
 *  attaches the token to every request and drops the session on 401.
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

  /**
   * Self-service profile update (PATCH /auth/me) — any signed-in role.
   * Send only what changes; a password change must include the current
   * one. The refreshed user is written back to the session so the shell
   * header picks up a new name immediately.
   */
  updateProfile(patch: {
    name?: string;
    currentPassword?: string;
    newPassword?: string;
  }): Observable<UserInterface> {
    return this.http
      .patch<ApiResponse<{ user: ApiUser }>>(`${API_BASE_URL}/auth/me`, patch)
      .pipe(
        map((res) => {
          const user = mapApiUser(res.data.user);
          this.session.setUser(user);
          return user;
        }),
        catchError((err: unknown) =>
          throwError(() => toApiError(err, 'Could not update your profile.')),
        ),
      );
  }

  /** POST /auth/forgot-password — always resolves; the backend replies with the same generic message whether or not the email is registered. */
  forgotPassword(email: string): Observable<void> {
    return this.http
      .post<ApiResponse<null>>(`${API_BASE_URL}/auth/forgot-password`, { email })
      .pipe(
        map(() => undefined),
        catchError((err: unknown) =>
          throwError(() => toApiError(err, 'Could not send reset email. Please try again.')),
        ),
      );
  }

  /** POST /auth/resend-activation — always resolves; only actually re-sends when the account exists and isn't activated yet. */
  resendActivationEmail(email: string): Observable<void> {
    return this.http
      .post<ApiResponse<null>>(`${API_BASE_URL}/auth/resend-activation`, { email })
      .pipe(
        map(() => undefined),
        catchError((err: unknown) =>
          throwError(() => toApiError(err, 'Could not resend the activation email. Please try again.')),
        ),
      );
  }

  /**
   * GET /auth/reset-password/:token/verify — read-only, doesn't consume
   * the token. Lets the reset-password page tell "still good" from
   * "already used or expired" as soon as it loads, instead of only on
   * submit. Treats a network/server error as invalid rather than
   * propagating it — the page has one thing to show either way (the
   * form, or an expired-link message), so there's no separate error state.
   */
  verifyResetToken(token: string): Observable<boolean> {
    return this.http
      .get<ApiResponse<{ valid: boolean }>>(`${API_BASE_URL}/auth/reset-password/${token}/verify`)
      .pipe(
        map((res) => res.data.valid),
        catchError(() => [false]),
      );
  }

  /** POST /auth/reset-password/:token */
  resetPassword(token: string, password: string, confirmPassword: string): Observable<void> {
    return this.http
      .post<ApiResponse<null>>(`${API_BASE_URL}/auth/reset-password/${token}`, {
        password,
        confirmPassword,
      })
      .pipe(
        map(() => undefined),
        catchError((err: unknown) =>
          throwError(() =>
            toApiError(err, 'Could not reset password. The link may be invalid or expired.'),
          ),
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
