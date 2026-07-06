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

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/components/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./features/auth/components/forgot-password/forgot-password.component').then(
        (m) => m.ForgotPasswordComponent,
      ),
  },

  // ── Admin routes (admin role only) ──────────────────────────────────────
  {
    path: 'admin',
    canActivate: [adminGuard],
    children: [
      { path: '', redirectTo: 'projects', pathMatch: 'full' },
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
        path: 'projects/new',
        loadComponent: () =>
          import('./features/projects/components/project-form/project-form.component').then(
            (m) => m.ProjectFormComponent,
          ),
      },
      {
        /*
         * Must be declared AFTER projects/new so Angular matches /new first.
         * :key is the URL-encoded project name (column A value).
         */
        path: 'projects/:key/edit',
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
        path: '',
        loadComponent: () =>
          import('./features/projects/components/project-list/project-list.component').then(
            (m) => m.ProjectListComponent,
          ),
      },
      {
        // :key is the URL-encoded project name (column A value).
        path: ':key/edit',
        loadComponent: () =>
          import('./features/projects/components/project-form/project-form.component').then(
            (m) => m.ProjectFormComponent,
          ),
      },
    ],
  },

  { path: '**', redirectTo: 'login' },
];
