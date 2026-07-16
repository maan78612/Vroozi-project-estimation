import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth/auth-service';
import { homeRouteForRole } from '../utils/role-route.util';

// Mirror image of adminGuard/projectUserGuard: keeps an already
// signed-in user off the auth routes (login, forgot-password) —
// e.g. browser back/forward or a stale link while a session is
// still live in memory — and bounces them to their own home route.
export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const role = authService.getRole();
  if (!role) return true;
  return router.createUrlTree([homeRouteForRole(role)]);
};
