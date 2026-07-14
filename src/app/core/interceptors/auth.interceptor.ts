import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { SessionService } from '../services/session/session-service';

/*
 * ──────────────────────────────────────────────────────────────────
 !  Attaches the JWT to every outgoing request and handles expiry:
 *  a 401 from any endpoint except login means the token is invalid
 *  or expired, so the session is dropped and the user sent back to
 *  the login page. Login's own 401 (wrong credentials) stays with
 *  the login form.
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
      if (
        err instanceof HttpErrorResponse &&
        err.status === 401 &&
        !req.url.includes('/auth/login')
      ) {
        session.clear();
        router.navigateByUrl('/login');
      }
      return throwError(() => err);
    }),
  );
};
