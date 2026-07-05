import { Service, signal } from '@angular/core';
import { UserInterface } from '../../intefaces/user-interface';
import { PasswordResetResultInterface } from '../../intefaces/auth-interface';
import { STATIC_USERS } from '../../data/static-user.data';
import {
  STATIC_AUTH_MESSAGES,
  STATIC_PASSWORD_RESET_HINTS,
} from '../../data/static-auth.data';
import { RoleEnum } from '../../enums/role-enum';

@Service()
export class AuthService {
  private currentUser = signal<UserInterface | null>(null);

  constructor() {
    this.restoreSession();
  }

  login(username: string, password: string): boolean {
    const match = STATIC_USERS.find((u) => u.username === username && u.password === password);
    if (!match) return false;

    sessionStorage.setItem('currentUser', JSON.stringify(match));
    this.currentUser.set(match);
    return true;
  }

  logout(): void {
    sessionStorage.removeItem('currentUser');
    this.currentUser.set(null);
  }

  requestPasswordReset(username: string): PasswordResetResultInterface {
    const user = STATIC_USERS.find((u) => u.username === username.trim());

    if (!user) {
      return { success: false, message: STATIC_AUTH_MESSAGES.userNotFound };
    }

    return {
      success: true,
      message: STATIC_PASSWORD_RESET_HINTS[user.username],
    };
  }

  isAuthenticated(): boolean {
    return this.currentUser() !== null;
  }

  getRole(): RoleEnum | null {
    return this.currentUser()?.role ?? null;
  }

  getCurrentUser(): UserInterface | null {
    return this.currentUser();
  }

  // Employees a project can be assigned/reassigned to — everyone with the User role.
  getAssignableUsers(): UserInterface[] {
    return STATIC_USERS.filter((u) => u.role === RoleEnum.User);
  }

  private restoreSession(): void {
    const stored = sessionStorage.getItem('currentUser');
    if (!stored) return;

    try {
      const user = JSON.parse(stored) as UserInterface;
      const isValid = STATIC_USERS.some((u) => u.id === user.id && u.username === user.username);
      if (isValid) {
        this.currentUser.set(user);
      } else {
        sessionStorage.removeItem('currentUser');
      }
    } catch {
      sessionStorage.removeItem('currentUser');
    }
  }
}
