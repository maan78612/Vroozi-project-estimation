import { Service, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { API_BASE_URL } from '../../config/api.config';
import {
  ApiBrdAnalysis,
  ApiProject,
  ApiResponse,
  PaginationMeta,
  toApiError,
} from '../../intefaces/api.interface';
import { ProjectInterface } from '../../intefaces/form/project.interface';
import { ProjectSizeEnum } from '../../enums/project-size.enum';

/*
 * ──────────────────────────────────────────────────────────────────
 !  HTTP layer for /projects — pure request/response + mapping.
 *
 *  The backend stores one document per supplier row — the same shape
 *  as this app's entries. `owner` (populated {_id, name, email})
 *  becomes the entry's `user` (id) + `userName` (display name).
 * ──────────────────────────────────────────────────────────────────
 */

const BASE = `${API_BASE_URL}/projects`;

function fromDoc(doc: ApiProject): ProjectInterface {
  const owner = typeof doc.owner === 'object' && doc.owner !== null ? doc.owner : null;
  const client = typeof doc.client === 'object' && doc.client !== null ? doc.client : null;
  return {
    id: doc._id,
    projectName: doc.projectName,
    erp: doc.erp,
    supplier: doc.supplier ?? '',
    client: client ? client._id : ((doc.client as string) ?? ''),
    clientName: client?.name,
    user: owner ? owner._id : ((doc.owner as string) ?? ''),
    userName: owner?.name,
    masterDataInterfaces: doc.masterDataInterfaces,
    transactionalInterfaces: doc.transactionalInterfaces,
    customLogic: doc.customLogic,
    uiImpact: doc.uiImpact,
    newApiOrBusinessFlows: doc.newApiOrBusinessFlows,
    integrations: doc.integrations,
    clientDependency: doc.clientDependency,
    reportingAnalytics: doc.reportingAnalytics,
    dataLayer: doc.dataLayer,
    uncertainties: doc.uncertainties,
    inbound: doc.inbound,
    outbound: doc.outbound,
    existingErp: doc.existingErp,
    hyperCare: doc.hyperCare,
    tentativeRangeDays: doc.tentativeRangeDays,
    tentativeProjectSize: doc.tentativeProjectSize as ProjectSizeEnum,
  };
}

/*
 * Builds the request body from an entry. Only fields the backend
 * accepts are sent — `id`, `user` and `userName` stay out (ownership
 * changes go through /reassign). Undefined fields are omitted, so the
 * same helper serves both full saves and partial PATCHes.
 */
function toBody(entry: Partial<ProjectInterface>): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  const copy = (key: keyof ProjectInterface) => {
    if (entry[key] !== undefined) body[key] = entry[key];
  };
  (
    [
      'projectName',
      'erp',
      'client',
      'masterDataInterfaces',
      'transactionalInterfaces',
      'customLogic',
      'uiImpact',
      'newApiOrBusinessFlows',
      'integrations',
      'clientDependency',
      'reportingAnalytics',
      'dataLayer',
      'uncertainties',
      'inbound',
      'outbound',
      'existingErp',
      'hyperCare',
      'tentativeProjectSize',
      'tentativeRangeDays',
    ] as (keyof ProjectInterface)[]
  ).forEach(copy);

  if (entry.supplier !== undefined) {
    body['supplier'] = entry.supplier.trim();
  }
  return body;
}

@Service()
export class ProjectsApiService {
  private http = inject(HttpClient);

  // One page of up to 100 entries (the server's own cap) — see
  // fetchAllPages, which callers use to walk every page.
  listPage(page: number): Observable<{ projects: ProjectInterface[]; meta?: PaginationMeta }> {
    return this.http
      .get<ApiResponse<{ projects: ApiProject[] }>>(BASE, { params: { limit: 100, page } })
      .pipe(
        map((res) => ({ projects: res.data.projects.map(fromDoc), meta: res.meta })),
        catchError((err: unknown) => throwError(() => toApiError(err, 'Could not load projects.'))),
      );
  }

  create(entry: ProjectInterface): Observable<ProjectInterface> {
    return this.http.post<ApiResponse<{ project: ApiProject }>>(BASE, toBody(entry)).pipe(
      map((res) => fromDoc(res.data.project)),
      catchError((err: unknown) =>
        throwError(() => toApiError(err, 'Could not save the project.')),
      ),
    );
  }

  update(id: string, changes: Partial<ProjectInterface>): Observable<ProjectInterface> {
    return this.http
      .patch<ApiResponse<{ project: ApiProject }>>(`${BASE}/${id}`, toBody(changes))
      .pipe(
        map((res) => fromDoc(res.data.project)),
        catchError((err: unknown) =>
          throwError(() => toApiError(err, 'Could not save the project.')),
        ),
      );
  }

  /*
   * Uploads a BRD document; the backend analyzes it with AI and returns
   * suggestions for steps 2-4 plus a short summary. No Content-Type set
   * here — HttpClient adds the multipart boundary itself.
   */
  analyzeBrd(file: File): Observable<ApiBrdAnalysis> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    return this.http.post<ApiResponse<ApiBrdAnalysis>>(`${BASE}/analyze-brd`, formData).pipe(
      map((res) => res.data),
      catchError((err: unknown) =>
        throwError(() => toApiError(err, 'Could not analyze the document.')),
      ),
    );
  }

  /** Admin only — changes the project's owner. */
  reassign(id: string, ownerId: string): Observable<ProjectInterface> {
    return this.http
      .patch<ApiResponse<{ project: ApiProject }>>(`${BASE}/${id}/reassign`, { ownerId })
      .pipe(
        map((res) => fromDoc(res.data.project)),
        catchError((err: unknown) =>
          throwError(() => toApiError(err, 'Could not reassign the project.')),
        ),
      );
  }

  /** Admin only. */
  delete(id: string): Observable<void> {
    return this.http
      .delete<void>(`${BASE}/${id}`)
      .pipe(
        catchError((err: unknown) =>
          throwError(() => toApiError(err, 'Could not delete the project.')),
        ),
      );
  }
}
