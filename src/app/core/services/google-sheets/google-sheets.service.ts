import { Service, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ProjectInterface } from '../../intefaces/form/project.interface';
import { GOOGLE_SHEETS_CONFIG } from '../../config/google-sheets.config';
import { groupToRows, rowsToProjects } from '../../utils/project-sheet.util';
import {
  SheetRow,
  SheetRequest,
  SheetResponse,
  SheetReadRequest,
  SheetAppendRequest,
  SheetUpdateRequest,
  SheetDeleteRequest,
} from '../../intefaces/sheets/sheet.interfaces';

/*
 * ──────────────────────────────────────────────────────────────────
 !  Talks to the deployed Apps Script (google-apps-script/Code.gs).
 *
 *  Connection values live in google-sheets.config.ts — deployment
 *  steps are at the top of Code.gs.
 * ──────────────────────────────────────────────────────────────────
 */
@Service()
export class GoogleSheetsService {
  private http = inject(HttpClient);

  private readonly scriptUrl = GOOGLE_SHEETS_CONFIG.scriptUrl;
  private readonly spreadsheetId = GOOGLE_SHEETS_CONFIG.spreadsheetId;

  // False until both config values are filled in — callers fall back to sample data.
  get isConfigured(): boolean {
    return !!this.scriptUrl && !!this.spreadsheetId;
  }

  /*
   * ──────────────────────────────────────────────────────────────────
   !  Sends as text/plain to avoid CORS preflight; Apps Script parses
   *  e.postData.contents. The script always answers HTTP 200, so a
   *  `success: false` body is turned into a thrown error here.
   * ──────────────────────────────────────────────────────────────────
   */
  private scriptPost<T>(payload: SheetRequest): Observable<T> {
    return this.http
      .post<SheetResponse<T>>(this.scriptUrl, JSON.stringify(payload), {
        headers: { 'Content-Type': 'text/plain' },
      })
      .pipe(
        map((res) => {
          if (!res.success) throw new Error(res.error || 'Google Sheets request failed');
          return res.data as T;
        }),
      );
  }

  // All supplier entries from the shared spreadsheet (one per row).
  getProjects(): Observable<ProjectInterface[]> {
    const payload: SheetReadRequest = { action: 'read', spreadsheetId: this.spreadsheetId };
    return this.scriptPost<SheetRow[]>(payload).pipe(map((rows) => rowsToProjects(rows ?? [])));
  }

  // Adds a brand-new project: its whole group of entries goes in at the bottom.
  appendProject(entries: ProjectInterface[]): Observable<void> {
    const payload: SheetAppendRequest = {
      action: 'append',
      spreadsheetId: this.spreadsheetId,
      rows: groupToRows(entries),
    };
    return this.scriptPost<void>(payload).pipe(map(() => undefined));
  }

  /*
   * ──────────────────────────────────────────────────────────────────
   !  Replaces the whole block of the project named `originalName`
   *  with this group of entries — covers editing a supplier, adding
   *  one to an existing project, and renaming the project. If no
   *  block matches, the Apps Script appends instead.
   * ──────────────────────────────────────────────────────────────────
   */

  updateProject(originalName: string, entries: ProjectInterface[]): Observable<void> {
    const payload: SheetUpdateRequest = {
      action: 'update',
      spreadsheetId: this.spreadsheetId,
      rowKey: originalName,
      rows: groupToRows(entries),
    };
    return this.scriptPost<void>(payload).pipe(map(() => undefined));
  }

  // Removes the whole block of the project with this name.
  deleteProject(projectName: string): Observable<void> {
    const payload: SheetDeleteRequest = {
      action: 'delete',
      spreadsheetId: this.spreadsheetId,
      rowKey: projectName,
    };
    return this.scriptPost<void>(payload).pipe(map(() => undefined));
  }
}
