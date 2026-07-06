import { Service, computed, inject, signal } from '@angular/core';
import { Observable, tap, throwError } from 'rxjs';
import { ProjectInterface } from '../../intefaces/form/project.interface';
import { GoogleSheetsService } from '../google-sheets/google-sheets.service';
import { STATIC_PROJECTS } from '../../data/static-projects.data';

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

  // Removes an entire project — every supplier entry sharing this projectName.
  deleteProject(projectName: string): Observable<void> {
    return this.persist(
      () => this.sheets.deleteProject(projectName),
      () => this.projects.update((list) => list.filter((e) => e.projectName !== projectName)),
    );
  }

  /*
   * ──────────────────────────────────────────────────────────────────
   !  Removes one supplier entry from a project. Deletes the whole
   *  project instead if this was its last remaining entry.
   * ──────────────────────────────────────────────────────────────────
   */
  deleteEntry(projectName: string, supplier: string): Observable<void> {
    const remaining = this.entriesFor(projectName).filter((e) => e.supplier !== supplier);
    const write = remaining.length
      ? () => this.sheets.updateProject(projectName, remaining)
      : () => this.sheets.deleteProject(projectName);

    return this.persist(write, () =>
      this.projects.update((list) =>
        list.filter((e) => !(e.projectName === projectName && e.supplier === supplier)),
      ),
    );
  }

  /*
   * ──────────────────────────────────────────────────────────────────
   !  persist() = the one place every save/delete goes through
   *
   *  Flow:
   *   1. No real sheet configured → error out, nothing is saved anywhere.
   *   2. Real sheet configured → send `write()`, update the signal only on success.
   *   3. If the real save fails, `tap(apply)` never runs — signal stays untouched.
   *
   *  Example — deleteProject('HEB') calls:
   *    persist(
   *      () => this.sheets.deleteProject('HEB'),   // write: the real save
   *      () => this.projects.update(list =>        // apply: update the signal
   *        list.filter(e => e.projectName !== 'HEB')),
   *    )
   * ──────────────────────────────────────────────────────────────────
   */
  private persist(write: () => Observable<void>, apply: () => void): Observable<void> {
    if (!this.sheets.isConfigured) {
      return throwError(() => new Error('Google Sheets is not configured — nothing was saved.'));
    }
    // Real sheet — send the write, update the signal only once it succeeds.
    return write().pipe(tap(apply));
  }
}
