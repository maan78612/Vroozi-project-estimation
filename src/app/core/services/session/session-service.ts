import { Service, signal } from '@angular/core';
import { UserInterface } from '../../intefaces/user-interface';

/*
 * ──────────────────────────────────────────────────────────────────
 !  In-memory session — the single owner of the JWT + signed-in user.
 *
 *  Nothing is persisted to the browser (no local/session storage):
 *  a page refresh drops the session and the guards send the user
 *  back to /login. AuthService writes through this service, and the
 *  HTTP interceptor reads the token from here so it never has to
 *  depend on AuthService itself.
 * ──────────────────────────────────────────────────────────────────
 */
@Service()
export class SessionService {
  private token = signal<string | null>(null);
  private user = signal<UserInterface | null>(null);

  readonly currentUser = this.user.asReadonly();

  getToken(): string | null {
    return this.token();
  }

  getUser(): UserInterface | null {
    return this.user();
  }

  store(token: string, user: UserInterface): void {
    this.token.set(token);
    this.user.set(user);
  }

  setUser(user: UserInterface): void {
    this.user.set(user);
  }

  clear(): void {
    this.token.set(null);
    this.user.set(null);
  }
}
