import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth/auth-service';
import { UsersService } from '../../../../core/services/users/users-service';
import { ProjectsStoreService } from '../../../../core/services/projects/projects-store.service';
import { UserInterface } from '../../../../core/intefaces/user-interface';
import { ButtonComponent } from '../../../../shared/compoments/button/button';
import { InitialsPipe } from '../../../../shared/pipes/initials.pipe';
import { SpinnerComponent } from '../../../../shared/compoments/spinner/spinner.component';

/*
 * ──────────────────────────────────────────────────────────────────
 !  Admin-only directory of employees
 *
 *  Shows every employee a project can be assigned to, alongside how
 *  many (and which) projects they currently own — so an admin can
 *  see workload at a glance and jump into that employee's projects.
 * ──────────────────────────────────────────────────────────────────
 */

// Cards show at most this many project chips before collapsing the rest into "+N more".
const MAX_VISIBLE_PROJECTS = 4;

@Component({
  selector: 'app-users-list',
  imports: [ButtonComponent, RouterLink, InitialsPipe, SpinnerComponent],
  templateUrl: './users-list.component.html',
  styleUrl: './users-list.component.less',
})
export class UsersListComponent {
  private authService = inject(AuthService);
  private usersService = inject(UsersService);
  private projectsStore = inject(ProjectsStoreService);
  private router = inject(Router);

  searchQuery = signal('');

  readonly username = computed(() => this.authService.getCurrentUser()?.name ?? '');

  private readonly employees = this.usersService.assignableUsers;

  // Employees + their project chips both come from the API.
  readonly isLoading = computed(
    () => this.usersService.loading() || this.projectsStore.loading(),
  );
  readonly loadError = this.usersService.loadError;

  constructor() {
    // Both lists come from the API — refresh them on page entry.
    this.usersService.load();
    this.projectsStore.load();
  }

  retryLoad(): void {
    this.usersService.load();
    this.projectsStore.load();
  }

  readonly filteredEmployees = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    if (!query) return this.employees();

    return this.employees().filter(
      (u) =>
        u.name.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query),
    );
  });

  // Distinct project names — an employee may own several supplier entries of one project.
  projectsFor(user: UserInterface): string[] {
    const names = this.projectsStore
      .all()
      .filter((p) => p.user === user.id)
      .map((p) => p.projectName);
    return Array.from(new Set(names));
  }

  visibleProjectsFor(user: UserInterface): string[] {
    return this.projectsFor(user).slice(0, MAX_VISIBLE_PROJECTS);
  }

  remainingProjectsCountFor(user: UserInterface): number {
    return Math.max(0, this.projectsFor(user).length - MAX_VISIBLE_PROJECTS);
  }

  // Avatar letters come from the shared `initials` pipe (see template).

  viewProjects(user: UserInterface): void {
    this.router.navigate(['/admin/projects'], {
      queryParams: { q: user.name },
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/login');
  }
}
