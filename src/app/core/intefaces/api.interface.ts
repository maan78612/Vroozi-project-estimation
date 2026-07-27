import { HttpErrorResponse } from '@angular/common/http';
import { RoleEnum } from '../enums/role-enum';
import { YesNo } from './form/project.interface';

/*
 * ──────────────────────────────────────────────────────────────────
 !  Wire shapes of the backend API (see project-managment-backend).
 *
 *  Every success response uses one envelope:
 *    { success: true, message, data, meta? }
 *  and every error mirrors it with { success: false, message, ... }.
 * ──────────────────────────────────────────────────────────────────
 */

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
}

/** User document as MongoDB returns it (password is never included). */
export interface ApiUser {
  _id: string;
  name: string;
  email: string;
  role: RoleEnum;
  jobTitle?: string;
  department?: string;
  createdAt?: string;
  updatedAt?: string;
}

/*
 * Project document — one document per supplier row, exactly like the
 * frontend's entries: `supplier` is a single name and may be empty.
 * `owner` arrives populated ({ _id, name, email }) from every endpoint
 * the app uses.
 */
export interface ApiProject {
  _id: string;
  projectName: string;
  projectScope: 'Internal' | 'External';
  erp: string;
  edi: YesNo;
  supplier: string;
  // Populated ({ _id, name, email }) from every endpoint the app uses,
  // same as `owner` — see ApiUser.
  client?: ApiUser | string;
  masterDataInterfaces: number;
  transactionalInterfaces: number;
  dataLayer: number;
  uncertainties: number;
  inbound: number;
  outbound: number;
  customLogic: YesNo;
  uiImpact: YesNo;
  newApiOrBusinessFlows: YesNo;
  integrations: YesNo;
  clientDependency: YesNo;
  reportingAnalytics: YesNo;
  existingErp: YesNo;
  hyperCare: YesNo;
  tentativeProjectSize: string;
  tentativeRangeDays: string;
  aiEfficiencyPercentage?: number;
  aiEstimatedRangeDays?: string;
  owner: ApiUser | string;
  createdAt?: string;
  updatedAt?: string;
}

/*
 * AI suggestions from POST /projects/analyze-brd — one value for every
 * wizard input on steps 2-4, ready for form.patchValue().
 */
export interface ApiBrdSuggestions {
  masterDataInterfaces: number;
  transactionalInterfaces: number;
  inbound: number;
  outbound: number;
  customLogic: YesNo;
  uiImpact: YesNo;
  newApiOrBusinessFlows: YesNo;
  integrations: YesNo;
  existingErp: YesNo;
  hyperCare: YesNo;
  clientDependency: YesNo;
  reportingAnalytics: YesNo;
  dataLayer: number;
  uncertainties: number;
}

/*
 * Model-reported extraction quality: "full" when the document explicitly
 * supported nearly every field, "partial" when several were inferred or
 * defaulted, "none" when it wasn't a usable BRD. Drives the result card's
 * success / warning / failure styling on the wizard's basics step.
 */
export type BrdCoverage = 'full' | 'partial' | 'none';

export interface ApiBrdAnalysis {
  suggestions: ApiBrdSuggestions;
  summary: string;
  coverage: BrdCoverage;
}

/*
 * Global AI-efficiency setting from GET/PATCH /ai-settings — a
 * singleton, not a pick-list: there is only ever one of these.
 */
export interface ApiAiSetting {
  _id: string;
  efficiencyPercentage: number;
}

/** ERP pick-list option from GET /erps. */
export interface ApiErp {
  _id: string;
  name: string;
}

/** Supplier pick-list option from GET /suppliers. */
export interface ApiSupplier {
  _id: string;
  name: string;
}

/** Payload of POST /auth/login and /auth/register. */
export interface ApiAuthData {
  user: ApiUser;
  token: string;
}

/** One field-level validation problem — mirrors the backend's FieldError. */
interface ApiFieldError {
  field: string;
  message: string;
}

/*
 * An Error that also carries the backend's machine-readable `code`, for
 * the rare case a component needs to branch on WHICH error this is
 * instead of just displaying the message (e.g. login's "account not
 * activated" dialog vs. a plain wrong-password banner). Every existing
 * `err instanceof Error` check keeps working unchanged, since this IS one.
 */
export class ApiClientError extends Error {
  code?: string;
  constructor(message: string, code?: string) {
    super(message);
    this.code = code;
  }
}

/** Login failure when an admin-created account hasn't set its password yet — must match the backend's literal ApiError code in auth.service.ts (project-managment-backend). */
export const ACCOUNT_NOT_ACTIVATED_CODE = 'ACCOUNT_NOT_ACTIVATED';

/*
 * Normalizes any HTTP failure into an Error whose message is the
 * backend's own `message` when available — components already display
 * `err.message`, so services throw through this helper.
 *
 * A 422 validation failure carries the real detail in `errors[]` (one
 * entry per bad field), not the generic top-level `message` ("Validation
 * failed") — join those into the returned message so the user actually
 * learns what's wrong, instead of every validation error in the app
 * rendering as the same unhelpful "Validation failed" banner.
 */
export function toApiError(err: unknown, fallback: string): Error {
  if (err instanceof HttpErrorResponse) {
    const body = err.error as { message?: string; errors?: ApiFieldError[]; code?: string } | null;
    const fieldMessages = body?.errors?.map((e) => e.message).filter(Boolean);
    if (fieldMessages?.length) return new ApiClientError(fieldMessages.join('. '), body?.code);
    if (body?.message) return new ApiClientError(body.message, body?.code);
    if (err.status === 0) {
      return new ApiClientError('Could not reach the server. Please check your connection and try again.');
    }
  }
  return err instanceof Error ? err : new ApiClientError(fallback);
}
