import { Service, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { API_BASE_URL } from '../../config/api.config';
import { ApiAiSetting, ApiResponse, toApiError } from '../../intefaces/api.interface';

/*
 * ──────────────────────────────────────────────────────────────────
 !  Global AI-efficiency percentage — a singleton setting (there is
 *  only ever one document on the backend), read by every role's
 *  project wizard and written only from the admin AI Settings page.
 * ──────────────────────────────────────────────────────────────────
 */
@Service()
export class AiSettingsService {
  private http = inject(HttpClient);

  readonly efficiencyPercentage = signal(0);
  readonly loading = signal(false);
  readonly loadError = signal('');

  load(): void {
    if (this.loading()) return;
    this.loading.set(true);
    this.loadError.set('');

    this.http.get<ApiResponse<{ aiSetting: ApiAiSetting }>>(`${API_BASE_URL}/ai-settings`).subscribe({
      next: (res) => {
        this.efficiencyPercentage.set(res.data.aiSetting.efficiencyPercentage);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.loadError.set(toApiError(err, 'Could not load the AI efficiency setting.').message);
      },
    });
  }

  /** Admin only (enforced server-side). */
  update(efficiencyPercentage: number): Observable<number> {
    return this.http
      .patch<ApiResponse<{ aiSetting: ApiAiSetting }>>(`${API_BASE_URL}/ai-settings`, {
        efficiencyPercentage,
      })
      .pipe(
        map((res) => {
          const updated = res.data.aiSetting.efficiencyPercentage;
          this.efficiencyPercentage.set(updated);
          return updated;
        }),
        catchError((err: unknown) =>
          throwError(() => toApiError(err, 'Could not save the AI efficiency setting.')),
        ),
      );
  }
}
