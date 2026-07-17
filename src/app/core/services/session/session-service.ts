import { Service, signal } from '@angular/core';
import { UserInterface } from '../../intefaces/user-interface';

const TOKEN_KEY = 'pe_auth_token';
const USER_KEY = 'pe_auth_user';

/** Reads a persisted session back out of localStorage. Corrupt/missing data → logged out. */
function readStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function readStoredUser(): UserInterface | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as UserInterface) : null;
  } catch {
    return null;
  }
}

/*
 * ──────────────────────────────────────────────────────────────────
 !  The single owner of the JWT + signed-in user, persisted to
 *  localStorage so a page refresh or a direct URL navigation doesn't
 *  drop the session. Signals are hydrated from storage at construction
 *  — this service is a singleton instantiated once before the router's
 *  first navigation, so the guards (which read synchronously) always
 *  see the restored state.
 *
 *  AuthService writes through this service, and the HTTP interceptor
 *  reads the token from here so it never has to depend on AuthService
 *  itself. An expired/invalid restored token is still caught by the
 *  interceptor's 401 handling, same as a token that expires mid-session.
 * ──────────────────────────────────────────────────────────────────
 */
@Service()
export class SessionService {
  private token = signal<string | null>(readStoredToken());
  private user = signal<UserInterface | null>(readStoredUser());

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
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  setUser(user: UserInterface): void {
    this.user.set(user);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  clear(): void {
    this.token.set(null);
    this.user.set(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
}
