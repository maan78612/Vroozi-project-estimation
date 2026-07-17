import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/services/auth/auth-service';
import { RoleService } from '../../../core/services/role/role-service';
import { ThemeService } from '../../../core/services/theme/theme-service';
import { InitialsPipe } from '../../pipes/initials.pipe';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';

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
  imports: [RouterOutlet, RouterLink, RouterLinkActive, InitialsPipe, ConfirmDialogComponent],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.less',
})
export class AppShellComponent {
  private authService = inject(AuthService);
  private roleService = inject(RoleService);
  private router = inject(Router);
  readonly themeService = inject(ThemeService);

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

  // The profile + static pages are registered inside both shell trees
  // (see profileAndStaticRoutes in app.routes.ts) — prefix by role.
  private readonly basePath = computed(() =>
    this.roleService.isAdmin() ? '/admin' : '/project',
  );

  readonly profilePath = computed(() => `${this.basePath()}/profile`);

  // The user-chip dropdown: Profile + the static pages, with Sign out
  // at the bottom (rendered separately in the template — it's a button,
  // not a link, and gets the destructive red treatment). This menu is
  // the only entry point to the static pages — the footer keeps just
  // the copyright line.
  readonly userMenuLinks = computed<NavLink[]>(() => [
    { label: 'My Profile', path: this.profilePath(), icon: 'account_circle' },
    { label: 'Privacy Policy', path: `${this.basePath()}/privacy-policy`, icon: 'shield_person' },
    { label: 'Terms of Use', path: `${this.basePath()}/terms`, icon: 'gavel' },
    { label: 'Contact Us', path: `${this.basePath()}/contact`, icon: 'mail' },
  ]);

  readonly userMenuOpen = signal(false);

  toggleUserMenu(): void {
    this.userMenuOpen.update((open) => !open);
  }

  closeUserMenu(): void {
    this.userMenuOpen.set(false);
  }

  // Outside click / Escape close the menu — same pattern as
  // SearchDropdownComponent and the wizard's mobile step list.
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.userMenuOpen() && !(event.target as HTMLElement).closest('.shell-user-wrap')) {
      this.userMenuOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.userMenuOpen.set(false);
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update((open) => !open);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  // Sign-out asks for confirmation first — it's from the same menu as
  // harmless links, so one slipped click shouldn't end the session.
  readonly signOutConfirmOpen = signal(false);

  requestSignOut(): void {
    this.closeMobileMenu();
    this.closeUserMenu();
    this.signOutConfirmOpen.set(true);
  }

  cancelSignOut(): void {
    this.signOutConfirmOpen.set(false);
  }

  confirmSignOut(): void {
    this.signOutConfirmOpen.set(false);
    this.authService.logout();
    this.router.navigateByUrl('/login');
  }
}
