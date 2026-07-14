import { Component, inject } from '@angular/core';
import { LoadingService } from '../../../core/services/loading/loading-service';

/*
 * ──────────────────────────────────────────────────────────────────
 !  Slim indeterminate progress bar pinned to the top of the screen.
 *
 *  Shows whenever ANY API request is in flight (fed by the loading
 *  interceptor through LoadingService) — a golden sweep in the brand
 *  color, like the bars on YouTube/GitHub. Mounted once in the root
 *  component, so no page has to wire it up.
 * ──────────────────────────────────────────────────────────────────
 */
@Component({
  selector: 'app-loading-bar',
  standalone: true,
  templateUrl: './loading-bar.component.html',
  styleUrl: './loading-bar.component.less',
})
export class LoadingBarComponent {
  private loadingService = inject(LoadingService);

  readonly isLoading = this.loadingService.isLoading;
}
