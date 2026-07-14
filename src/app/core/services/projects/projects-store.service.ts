import { Service, computed, inject, signal } from '@angular/core';
import { Observable, forkJoin, map, of, switchMap, tap, throwError } from 'rxjs';
import { ProjectInterface } from '../../intefaces/form/project.interface';
import { ProjectsApiService } from './projects-api.service';
import { AuthService } from '../auth/auth-service';
import { RoleEnum } from '../../enums/role-enum';

/*
 * ──────────────────────────────────────────────────────────────────
 !  Supplier-entry store backed by the /projects API. Holds one entry
 *  per supplier row; entries sharing a projectName form a project.
 *  Every mutation goes to the backend first, then the list is
 *  re-fetched so the signal always mirrors the server (including
 *  populated owner names after a reassign).
 * ──────────────────────────────────────────────────────────────────
 */
@Service()
export class ProjectsStoreService {
  private api = inject(ProjectsApiService);
  private authService = inject(AuthService);

  private readonly projects = signal<ProjectInterface[]>([]);

  readonly all = this.projects.asReadonly();
  readonly loading = signal(false);
  readonly loadError = signal('');

  // Unique project names — feeds the "add supplier to existing project" dropdown.
  readonly projectNames = computed(() =>
    Array.from(new Set(this.projects().map((p) => p.projectName))).sort(),
  );

  /*
   * Fetches the list (backend already scopes it: admins get every
   * project, users only their own). Pages call this on entry so a
   * returning visit — or a different signed-in user — sees fresh data.
   */
  load(): void {
    if (this.loading()) return;
    this.loading.set(true);
    this.loadError.set('');

    this.api.list().subscribe({
      next: (entries) => {
        this.projects.set(entries);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.loadError.set(
          err instanceof Error ? err.message : 'Could not load projects.',
        );
      },
    });
  }

  entriesFor(projectName: string): ProjectInterface[] {
    return this.projects().filter((p) => p.projectName === projectName);
  }

  getByKey(projectName: string, supplier: string): ProjectInterface | undefined {
    return this.projects().find((p) => p.projectName === projectName && p.supplier === supplier);
  }

  // Adds a supplier entry — starts a new project or extends an existing one.
  add(entry: ProjectInterface): Observable<void> {
    return this.api.create(entry).pipe(
      // The backend always makes the creator the owner; when an admin
      // assigned someone else in the form, move ownership right after.
      switchMap((created) => this.reassignIfNeeded(created, entry.user)),
      switchMap(() => this.refresh$()),
    );
  }

  /*
   * ──────────────────────────────────────────────────────────────────
   !  Replaces one supplier entry, found by its original name+supplier.
   *  If the project name was edited, the rename applies to the whole
   *  project — every sibling document gets the new projectName too.
   * ──────────────────────────────────────────────────────────────────
   */
  updateEntry(
    originalName: string,
    originalSupplier: string,
    entry: ProjectInterface,
  ): Observable<void> {
    const existing = this.getByKey(originalName, originalSupplier);
    if (!existing?.id) {
      return throwError(() => new Error('This project entry no longer exists.'));
    }

    const siblings =
      entry.projectName !== originalName
        ? this.entriesFor(originalName).filter((e) => e.id && e.id !== existing.id)
        : [];

    return this.api.update(existing.id, entry).pipe(
      switchMap((updated) => this.reassignIfNeeded(updated, entry.user)),
      switchMap(() =>
        siblings.length
          ? forkJoin(siblings.map((s) => this.api.update(s.id!, { projectName: entry.projectName })))
          : of(null),
      ),
      switchMap(() => this.refresh$()),
    );
  }

  // Removes an entire project — every supplier entry sharing this projectName.
  deleteProject(projectName: string): Observable<void> {
    const ids = this.entriesFor(projectName)
      .map((e) => e.id)
      .filter((id): id is string => !!id);

    if (!ids.length) return this.refresh$();
    return forkJoin(ids.map((id) => this.api.delete(id))).pipe(switchMap(() => this.refresh$()));
  }

  // Removes one supplier entry from a project.
  deleteEntry(projectName: string, supplier: string): Observable<void> {
    const entry = this.getByKey(projectName, supplier);
    if (!entry?.id) {
      return throwError(() => new Error('This project entry no longer exists.'));
    }
    return this.api.delete(entry.id).pipe(switchMap(() => this.refresh$()));
  }

  /*
   * Ownership follow-up after a save: only admins may reassign, and
   * only when the form picked someone other than the current owner.
   */
  private reassignIfNeeded(
    saved: ProjectInterface,
    targetUserId: string,
  ): Observable<unknown> {
    const isAdmin = this.authService.getRole() === RoleEnum.Admin;
    if (!isAdmin || !saved.id || !targetUserId || targetUserId === saved.user) {
      return of(null);
    }
    return this.api.reassign(saved.id, targetUserId);
  }

  // Re-fetch after every mutation — one source of truth: the server.
  private refresh$(): Observable<void> {
    return this.api.list().pipe(
      tap((entries) => this.projects.set(entries)),
      map(() => undefined),
    );
  }
}
