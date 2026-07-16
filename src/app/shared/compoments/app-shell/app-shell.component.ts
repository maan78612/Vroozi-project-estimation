import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/services/auth/auth-service';
import { RoleService } from '../../../core/services/role/role-service';
import { InitialsPipe } from '../../pipes/initials.pipe';

interface NavLink {
  label: string;
  path: string;
  icon: string;
}

/*
 * ──────────────────────────────────────────────────────────────────
 !  Persistent app chrome — brand, role-aware primary nav, and the
 *  signed-in user's avatar/sign-out. Wraps the `admin/*` and
 *  `project/*` route trees as their parent route component (see
 *  app.routes.ts); the project-form wizard deliberately stays
 *  outside it and keeps its own full-bleed step layout.
 *
 *  Previously there was no persistent nav anywhere in the app —
 *  individual pages (project-view, users-list) each carried their
 *  own ad hoc "signed in as X / Sign out" bit in their own header.
 *  That's centralized here now instead.
 * ──────────────────────────────────────────────────────────────────
 */
@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, InitialsPipe],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.less',
})
export class AppShellComponent {
  private authService = inject(AuthService);
  private roleService = inject(RoleService);
  private router = inject(Router);

  readonly currentUser = computed(() => this.authService.getCurrentUser());
  readonly mobileMenuOpen = signal(false);

  readonly navLinks = computed<NavLink[]>(() => {
    if (this.roleService.isAdmin()) {
      return [
        { label: 'Projects', path: '/admin/projects', icon: 'folder_open' },
        { label: 'Employees', path: '/admin/users', icon: 'group' },
        { label: 'Clients', path: '/admin/clients', icon: 'domain' },
      ];
    }
    return [{ label: 'Projects', path: '/project', icon: 'folder_open' }];
  });

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update((open) => !open);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  signOut(): void {
    this.closeMobileMenu();
    this.authService.logout();
    this.router.navigateByUrl('/login');
  }
}
