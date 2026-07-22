/*
 * ──────────────────────────────────────────────────────────────────
 !  Application route table
 *
 *  Maps URL paths to lazy-loaded feature components. Admin routes
 *  and project-user routes are gated by role-based guards.
 * ──────────────────────────────────────────────────────────────────
 */

import { Routes } from '@angular/router';
import { adminGuard } from './core/guards/admin.guard';
import { projectUserGuard } from './core/guards/project-user.guard';
import { guestGuard } from './core/guards/guest.guard';
import { AppShellComponent } from './shared/compoments/app-shell/app-shell.component';

/*
 * Pages every signed-in role gets, rendered inside whichever shell the
 * role lives in — spread into BOTH shell trees below so they resolve as
 * /admin/profile and /project/profile etc., keeping each role inside its
 * own guarded URL space (and its own nav chrome).
 */
const profileAndStaticRoutes: Routes = [
  {
    path: 'profile',
    loadComponent: () =>
      import('./features/profile/components/profile/profile.component').then(
        (m) => m.ProfileComponent,
      ),
  },
  {
    path: 'privacy-policy',
    loadComponent: () =>
      import('./features/static/components/privacy-policy/privacy-policy.component').then(
        (m) => m.PrivacyPolicyComponent,
      ),
  },
  {
    path: 'terms',
    loadComponent: () =>
      import('./features/static/components/terms-of-use/terms-of-use.component').then(
        (m) => m.TermsOfUseComponent,
      ),
  },
  {
    path: 'contact',
    loadComponent: () =>
      import('./features/static/components/contact-us/contact-us.component').then(
        (m) => m.ContactUsComponent,
      ),
  },
];

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/components/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'forgot-password',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/components/forgot-password/forgot-password.component').then(
        (m) => m.ForgotPasswordComponent,
      ),
  },
  {
    path: 'reset-password/:token',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/components/reset-password/reset-password.component').then(
        (m) => m.ResetPasswordComponent,
      ),
  },

  // ── Admin routes (admin role only) ──────────────────────────────────────
  {
    path: 'admin',
    canActivate: [adminGuard],
    children: [
      { path: '', redirectTo: 'projects', pathMatch: 'full' },
      {
        // Persistent nav shell — wraps every admin page EXCEPT the
        // project-form wizard below, which stays full-bleed with its
        // own step sidebar.
        path: '',
        component: AppShellComponent,
        children: [
          {
            // Shared with the /project route below — it renders the admin view by role.
            path: 'projects',
            loadComponent: () =>
              import('./features/projects/components/project-list/project-list.component').then(
                (m) => m.ProjectListComponent,
              ),
          },
          {
            path: 'users',
            loadComponent: () =>
              import('./features/admin/components/users-list/users-list.component').then(
                (m) => m.UsersListComponent,
              ),
          },
          {
            path: 'clients',
            loadComponent: () =>
              import('./features/admin/components/clients-list/clients-list.component').then(
                (m) => m.ClientsListComponent,
              ),
          },
          {
            // Read-only detail screen for the project — a "project" here is
            // every entry sharing a project name, not a single document, so
            // there's no one id to route on. :id anchors on one of those
            // entries (picked in viewGroup() below); ProjectViewComponent
            // resolves it back to the project name and shows every sibling.
            path: 'projects/:id/view',
            loadComponent: () =>
              import('./features/projects/components/project-view/project-view.component').then(
                (m) => m.ProjectViewComponent,
              ),
          },
          ...profileAndStaticRoutes,
        ],
      },
      {
        path: 'projects/new',
        loadComponent: () =>
          import('./features/projects/components/project-form/project-form.component').then(
            (m) => m.ProjectFormComponent,
          ),
      },
      {
        /*
         * Must be declared AFTER projects/new so Angular matches /new first.
         * :id is the entry's own Mongo _id — stable, and never needs URL
         * encoding (unlike the project name, which can contain spaces).
         */
        path: 'projects/:id/edit',
        loadComponent: () =>
          import('./features/projects/components/project-form/project-form.component').then(
            (m) => m.ProjectFormComponent,
          ),
      },
    ],
  },

  // ── Project-user routes (user role only) ────────────────────────────────
  {
    path: 'project',
    canActivate: [projectUserGuard],
    children: [
      {
        // Persistent nav shell — wraps the list/detail pages; the
        // wizard (:id/edit, below) stays outside it.
        path: '',
        component: AppShellComponent,
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/projects/components/project-list/project-list.component').then(
                (m) => m.ProjectListComponent,
              ),
          },
          ...profileAndStaticRoutes,
          {
            // Read-only detail screen for the project — :id anchors on one
            // entry (see the admin route of the same shape above for why).
            // Declared AFTER the profile/static routes so fixed words like
            // `profile` match those, not this parameter.
            path: ':id/view',
            loadComponent: () =>
              import('./features/projects/components/project-view/project-view.component').then(
                (m) => m.ProjectViewComponent,
              ),
          },
        ],
      },
      {
        // :id is the entry's own Mongo _id — see the admin route of the
        // same shape above for why this isn't the project name.
        path: ':id/edit',
        loadComponent: () =>
          import('./features/projects/components/project-form/project-form.component').then(
            (m) => m.ProjectFormComponent,
          ),
      },
    ],
  },

  { path: '**', redirectTo: 'login' },
];
