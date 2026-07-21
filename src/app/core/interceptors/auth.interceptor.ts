import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { SessionService } from '../services/session/session-service';

/*
 * ──────────────────────────────────────────────────────────────────
 !  Attaches the JWT (restored from localStorage via SessionService,
 *  or freshly issued at login) to every outgoing request and handles
 *  expiry: a 401 from most endpoints means the token is invalid or
 *  expired, so the session is dropped and the user sent back to the
 *  login page. Two endpoints are excluded because a 401 from them is
 *  an expected, user-facing input error, not a dead session — login's
 *  own 401 (wrong credentials) stays with the login form, and a PATCH
 *  to /auth/me (Profile's "Change password") 401s when the CURRENT
 *  password is wrong, which should stay on the Profile form too
 *  (see ProfileComponent.savePassword) instead of silently logging
 *  the user out before they ever see why.
 * ──────────────────────────────────────────────────────────────────
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const session = inject(SessionService);
  const router = inject(Router);

  const token = session.getToken();
  const authedReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authedReq).pipe(
    catchError((err: unknown) => {
      const isLoginAttempt = req.url.includes('/auth/login');
      const isProfileUpdate = req.method === 'PATCH' && req.url.includes('/auth/me');
      if (
        err instanceof HttpErrorResponse &&
        err.status === 401 &&
        !isLoginAttempt &&
        !isProfileUpdate
      ) {
        session.clear();
        router.navigateByUrl('/login');
      }
      return throwError(() => err);
    }),
  );
};
