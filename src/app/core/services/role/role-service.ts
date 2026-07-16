import { Service, computed, inject } from '@angular/core';
import { RoleEnum } from '../../enums/role-enum';
import { SessionService } from '../session/session-service';

/*
 * ──────────────────────────────────────────────────────────────────
 !  Single source of truth for "what can this signed-in user do?" —
 *  previously each component re-derived `authService.getRole() ===
 *  RoleEnum.X` as its own local computed signal (project-list,
 *  project-view, project-form, and projects-store.service each did
 *  this independently). Centralizing it here means role logic only
 *  changes in one place, and it's reactive to session changes since
 *  it's built on SessionService's signal rather than a snapshot call.
 * ──────────────────────────────────────────────────────────────────
 */
@Service()
export class RoleService {
  private session = inject(SessionService);

  readonly role = computed(() => this.session.currentUser()?.role ?? null);

  readonly isAdmin = computed(() => this.role() === RoleEnum.Admin);
  readonly isUser = computed(() => this.role() === RoleEnum.User);
  readonly isClient = computed(() => this.role() === RoleEnum.Client);
}
