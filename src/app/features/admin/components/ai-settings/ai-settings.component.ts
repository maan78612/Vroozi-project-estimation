import { Component, effect, inject, signal } from '@angular/core';
import { ButtonComponent } from '../../../../shared/compoments/button/button';
import { AiSettingsService } from '../../../../core/services/ai-settings/ai-settings-service';

/*
 * ──────────────────────────────────────────────────────────────────
 !  Admin-only — sets the global "AI efficiency %" used to show an
 *  AI-assisted delivery estimate on the project wizard's Review &
 *  Submit step. Not part of the project form itself: this is a
 *  single app-wide value, same for every project.
 * ──────────────────────────────────────────────────────────────────
 */
@Component({
  selector: 'app-ai-settings',
  standalone: true,
  imports: [ButtonComponent],
  templateUrl: './ai-settings.component.html',
  styleUrl: './ai-settings.component.less',
})
export class AiSettingsComponent {
  private aiSettingsService = inject(AiSettingsService);

  readonly loading = this.aiSettingsService.loading;
  readonly loadError = this.aiSettingsService.loadError;

  // Local draft — only pushed to the service/backend on Save, so
  // dragging the slider doesn't change the value live projects see.
  draftPercentage = signal(0);

  saving = signal(false);
  saveError = signal('');
  saveSuccess = signal(false);

  readonly isDirty = () => this.draftPercentage() !== this.aiSettingsService.efficiencyPercentage();

  // Keeps the slider synced to whatever the backend reports — including
  // once the GET actually resolves, which happens asynchronously after
  // this component (and this effect) is already constructed — right up
  // until the user actually drags it themselves.
  private userEdited = false;

  constructor() {
    this.aiSettingsService.load();
    effect(() => {
      const current = this.aiSettingsService.efficiencyPercentage();
      if (!this.userEdited) {
        this.draftPercentage.set(current);
      }
    });
  }

  onSliderChange(value: string): void {
    this.userEdited = true;
    this.draftPercentage.set(Number(value));
    this.saveSuccess.set(false);
  }

  sliderTrack(): string {
    const v = this.draftPercentage();
    return `linear-gradient(to right, var(--color-primary) ${v}%, var(--color-surface-container-high) ${v}%)`;
  }

  save(): void {
    this.saving.set(true);
    this.saveError.set('');
    this.saveSuccess.set(false);

    this.aiSettingsService.update(this.draftPercentage()).subscribe({
      next: () => {
        this.saving.set(false);
        this.saveSuccess.set(true);
      },
      error: (err: unknown) => {
        this.saving.set(false);
        this.saveError.set(
          err instanceof Error ? err.message : 'Could not save the AI efficiency setting.',
        );
      },
    });
  }
}
