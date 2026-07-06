import { Service, computed, signal } from '@angular/core';
import { Observable, of, tap } from 'rxjs';
import { ProjectInterface } from '../../intefaces/form/project.interface';
import { STATIC_PROJECTS } from '../../data/static-projects.data';

/*
 * ──────────────────────────────────────────────────────────────────
 !  Supplier-entry store backed by static JSON (temporary — see
 *  static-projects.data.ts). Holds one entry per supplier row;
 *  entries sharing a projectName form a project. This is an
 *  in-memory store: writes update the signal immediately and are
 *  not persisted anywhere yet — that arrives with the MongoDB backend.
 * ──────────────────────────────────────────────────────────────────
 */
@Service()
export class ProjectsStoreService {
  private readonly projects = signal<ProjectInterface[]>([]);

  readonly all = this.projects.asReadonly();
  readonly loading = signal(false);
  readonly loadError = signal('');

  // Unique project names — feeds the "add supplier to existing project" dropdown.
  readonly projectNames = computed(() =>
    Array.from(new Set(this.projects().map((p) => p.projectName))).sort(),
  );

  constructor() {
    this.load();
  }

  load(): void {
    this.projects.set([...STATIC_PROJECTS]);
  }

  entriesFor(projectName: string): ProjectInterface[] {
    return this.projects().filter((p) => p.projectName === projectName);
  }

  getByKey(projectName: string, supplier: string): ProjectInterface | undefined {
    return this.projects().find((p) => p.projectName === projectName && p.supplier === supplier);
  }

  // Adds a supplier entry — starts a new project or extends an existing one.
  add(entry: ProjectInterface): Observable<void> {
    return this.persist(() => this.projects.update((list) => [...list, entry]));
  }

  /*
   * ──────────────────────────────────────────────────────────────────
   !  Replaces one supplier entry, found by its original name+supplier.
   *  If the project name was edited, the rename applies to the whole
   *  project — every entry in the group moves with it.
   * ──────────────────────────────────────────────────────────────────
   */
  updateEntry(
    originalName: string,
    originalSupplier: string,
    entry: ProjectInterface,
  ): Observable<void> {
    return this.persist(() =>
      this.projects.update((list) =>
        list.map((e) => {
          if (e.projectName !== originalName) return e;
          return e.supplier === originalSupplier ? entry : { ...e, projectName: entry.projectName };
        }),
      ),
    );
  }

  // Removes an entire project — every supplier entry sharing this projectName.
  deleteProject(projectName: string): Observable<void> {
    return this.persist(() =>
      this.projects.update((list) => list.filter((e) => e.projectName !== projectName)),
    );
  }

  /*
   * ──────────────────────────────────────────────────────────────────
   !  Removes one supplier entry from a project. Deletes the whole
   *  project instead if this was its last remaining entry.
   * ──────────────────────────────────────────────────────────────────
   */
  deleteEntry(projectName: string, supplier: string): Observable<void> {
    return this.persist(() =>
      this.projects.update((list) =>
        list.filter((e) => !(e.projectName === projectName && e.supplier === supplier)),
      ),
    );
  }

  // Every save/delete goes through here — keeps the Observable-based
  // contract callers already use, ready to swap for a real API call later.
  private persist(apply: () => void): Observable<void> {
    return of(undefined).pipe(tap(apply));
  }
}
