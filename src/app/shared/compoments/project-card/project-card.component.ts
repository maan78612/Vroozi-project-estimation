import { Component, input, output } from '@angular/core';
import { ProjectInterface } from '../../../core/intefaces/form/project.interface';
import { ProjectSizeEnum } from '../../../core/enums/project-size.enum';
import { PROJECT_SIZE_ORDER } from '../../../core/utils/project-sort.util';
import { COMPLEXITY_FLAGS } from '../../../core/data/feature-flags.data';
import { ButtonComponent } from '../button/button';
import { ListSummaryPipe } from '../../pipes/list-summary.pipe';

/*
 * ──────────────────────────────────────────────────────────────────
 !  Shared project card — one card per PROJECT
 *
 *  Receives the project's supplier entries and rolls them up:
 *  interfaces and flows are summed, risk bars show the highest
 *  value, the size badge shows the largest size, and the day range
 *  spans the earliest start to the latest end. "Edit" is handled by
 *  the parent list (direct edit, or supplier picker when several).
 * ──────────────────────────────────────────────────────────────────
 */
// Cards show at most this many signal tags before collapsing the rest into "+N more".
const MAX_VISIBLE_SIGNALS = 3;

@Component({
  selector: 'app-project-card',
  standalone: true,
  imports: [ButtonComponent, ListSummaryPipe],
  templateUrl: './project-card.component.html',
  styleUrl: './project-card.component.less',
})
export class ProjectCardComponent {
  entries = input.required<ProjectInterface[]>();
  assignedToName = input<string | null>(null);

  edit = output<void>();

  readonly ProjectSizeEnum = ProjectSizeEnum;
  private readonly complexityFlags = COMPLEXITY_FLAGS;

  projectName(): string {
    return this.entries()[0]?.projectName ?? '';
  }

  erp(): string {
    return this.entries().find((e) => e.erp)?.erp ?? '';
  }

  suppliers(): string[] {
    return this.entries()
      .map((e) => e.supplier)
      .filter(Boolean);
  }

  // Largest size across the suppliers — the project is at least this big.
  size(): ProjectSizeEnum | null {
    let best: ProjectSizeEnum | null = null;
    for (const e of this.entries()) {
      if (!e.tentativeProjectSize) continue;
      if (
        !best ||
        PROJECT_SIZE_ORDER.indexOf(e.tentativeProjectSize) > PROJECT_SIZE_ORDER.indexOf(best)
      ) {
        best = e.tentativeProjectSize;
      }
    }
    return best;
  }

  // Risk bars show the highest value among the suppliers.
  dataLayer(): number {
    return Math.max(0, ...this.entries().map((e) => e.dataLayer));
  }

  uncertainties(): number {
    return Math.max(0, ...this.entries().map((e) => e.uncertainties));
  }

  interfacesTotal(): number {
    return this.entries().reduce(
      (sum, e) => sum + e.masterDataInterfaces + e.transactionalInterfaces,
      0,
    );
  }

  inboundTotal(): number {
    return this.entries().reduce((sum, e) => sum + e.inbound, 0);
  }

  outboundTotal(): number {
    return this.entries().reduce((sum, e) => sum + e.outbound, 0);
  }

  // Earliest start to latest end across all supplier ranges, e.g. "20-70".
  rangeLabel(): string {
    let low = Infinity;
    let high = -Infinity;

    for (const e of this.entries()) {
      const match = e.tentativeRangeDays?.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/);
      if (!match) continue;
      low = Math.min(low, Number(match[1]));
      high = Math.max(high, Number(match[2]));
    }

    return low === Infinity ? '' : `${low}-${high}`;
  }

  // A flag counts when ANY supplier entry has it set to Yes.
  private activeFlags(): string[] {
    return this.complexityFlags
      .filter((f) => this.entries().some((e) => e[f.key] === 'Yes'))
      .map((f) => f.label);
  }

  visibleSignals(): string[] {
    return this.activeFlags().slice(0, MAX_VISIBLE_SIGNALS);
  }

  remainingSignalsCount(): number {
    return Math.max(0, this.activeFlags().length - MAX_VISIBLE_SIGNALS);
  }
}
