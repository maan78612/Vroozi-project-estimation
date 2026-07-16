import { RoleEnum } from '../enums/role-enum';

/*
 * ──────────────────────────────────────────────────────────────────
 !  Where a signed-in user lands — used after login and by any guard
 *  that needs to bounce a role away from a route that isn't theirs
 *  (see project-user.guard.ts and guest.guard.ts).
 * ──────────────────────────────────────────────────────────────────
 */
export function homeRouteForRole(role: RoleEnum): string {
  return role === RoleEnum.Admin ? '/admin/projects' : '/project';
}
