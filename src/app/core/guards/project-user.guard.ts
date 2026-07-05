import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth/auth-service';
import { RoleEnum } from '../enums/role-enum';

export const projectUserGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const role = authService.getRole();
  if (role === RoleEnum.User) return true;
  if (role === RoleEnum.Admin) return router.createUrlTree(['/admin/projects']);
  return router.createUrlTree(['/login']);
};
