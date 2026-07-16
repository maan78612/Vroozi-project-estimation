import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth/auth-service';
import { RoleEnum } from '../enums/role-enum';
import { homeRouteForRole } from '../utils/role-route.util';

// Shared by the employee (User) and client-user (Client) roles — both get
// the same "/project" screens (view + edit, no create/delete), just scoped
// differently server-side (owner vs. clientCompany). See project.service.ts.
export const projectUserGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const role = authService.getRole();
  if (role === RoleEnum.User || role === RoleEnum.Client) return true;
  if (role === RoleEnum.Admin) return router.createUrlTree([homeRouteForRole(role)]);
  return router.createUrlTree(['/login']);
};
