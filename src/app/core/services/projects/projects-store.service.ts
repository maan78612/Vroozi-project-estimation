import { Service, computed, inject, signal } from '@angular/core';
import { Observable, delay, of, tap } from 'rxjs';
import { ProjectInterface } from '../../intefaces/form/project.interface';
import { GoogleSheetsService } from '../google-sheets/google-sheets.service';
import { STATIC_PROJECTS } from '../../data/static-projects.data';

// Small delay so a local (unconfigured) save still feels like an action.
const LOCAL_SAVE_DELAY_MS = 400;

/*
 * ──────────────────────────────────────────────────────────────────
 !  Supplier-entry store backed by the shared Google Sheet
 *
 *  Holds one entry per supplier row; entries sharing a projectName
 *  form a project. Saves send the project's whole group to the sheet
 *  and only touch the signal after the sheet confirms. Until
 *  google-sheets.config.ts is filled in, it runs on sample data.
 * ──────────────────────────────────────────────────────────────────
 */
@Service()
export class ProjectsStoreService {
  private sheets = inject(GoogleSheetsService);

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
    if (!this.sheets.isConfigured) {
      this.projects.set([...STATIC_PROJECTS]);
      return;
    }

    this.loading.set(true);
    this.loadError.set('');
    this.sheets.getProjects().subscribe({
      next: (list) => {
        this.projects.set(list);
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set('Could not load projects from the shared Google Sheet.');
        this.loading.set(false);
      },
    });
  }

  entriesFor(projectName: string): ProjectInterface[] {
    return this.projects().filter((p) => p.projectName === projectName);
  }

  getByKey(projectName: string, supplier: string): ProjectInterface | undefined {
    return this.projects().find(
      (p) => p.projectName === projectName && p.supplier === supplier,
    );
  }

  // Adds a supplier entry — starts a new project or extends an existing one.
  add(entry: ProjectInterface): Observable<void> {
    const group = this.entriesFor(entry.projectName);
    const write = group.length
      ? () => this.sheets.updateProject(entry.projectName, [...group, entry])
      : () => this.sheets.appendProject([entry]);

    return this.persist(write, () => this.projects.update((list) => [...list, entry]));
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
    const group = this.entriesFor(originalName).map((e) =>
      e.supplier === originalSupplier ? entry : { ...e, projectName: entry.projectName },
    );

    return this.persist(
      () => this.sheets.updateProject(originalName, group),
      () =>
        this.projects.update((list) =>
          list.map((e) => {
            if (e.projectName !== originalName) return e;
            return e.supplier === originalSupplier
              ? entry
              : { ...e, projectName: entry.projectName };
          }),
        ),
    );
  }

  // Sheet first, signal after — a failed save never shows up in the app.
  private persist(write: () => Observable<void>, apply: () => void): Observable<void> {
    if (!this.sheets.isConfigured) {
      return of(undefined).pipe(delay(LOCAL_SAVE_DELAY_MS), tap(apply));
    }
    return write().pipe(tap(apply));
  }
}
