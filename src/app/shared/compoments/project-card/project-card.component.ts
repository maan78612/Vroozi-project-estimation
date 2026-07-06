import { Component, input, output } from '@angular/core';
import { ProjectInterface } from '../../../core/intefaces/form/project.interface';
import { ProjectSizeEnum } from '../../../core/enums/project-size.enum';
import { PROJECT_SIZE_ORDER } from '../../../core/utils/project-sort.util';
import { ButtonComponent } from '../button/button';

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
// Supplier chip shows at most this many names before collapsing the rest into "+N".
const MAX_VISIBLE_SUPPLIERS = 2;

@Component({
  selector: 'app-project-card',
  standalone: true,
  imports: [ButtonComponent],
  templateUrl: './project-card.component.html',
  styleUrl: './project-card.component.less',
})
export class ProjectCardComponent {
  entries = input.required<ProjectInterface[]>();
  assignedToName = input<string | null>(null);

  edit = output<void>();
  delete = output<void>();

  readonly ProjectSizeEnum = ProjectSizeEnum;

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

  visibleSuppliers(): string {
    return this.suppliers().slice(0, MAX_VISIBLE_SUPPLIERS).join(', ');
  }

  hiddenSuppliersCount(): number {
    return Math.max(0, this.suppliers().length - MAX_VISIBLE_SUPPLIERS);
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
}
