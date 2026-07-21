import { ProjectInterface } from '../intefaces/form/project.interface';
import { ProjectSizeEnum } from '../enums/project-size.enum';
import { PROJECT_SIZE_ORDER } from './project-sort.util';

/*
 * ──────────────────────────────────────────────────────────────────
 !  Rolls a project's supplier entries up into single display values —
 *  shared by ProjectCardComponent, ProjectViewComponent, and the
 *  Project List table, all three of which need the same "one project,
 *  several supplier rows" aggregation (previously duplicated between
 *  the first two verbatim).
 * ──────────────────────────────────────────────────────────────────
 */

// Distinct non-empty values of `field` across entries — '' if none, the
// single shared value if they agree, 'Multiple' if they differ.
function rollupDistinct(entries: ProjectInterface[], field: 'erp' | 'clientName'): string {
  const values = new Set(entries.map((e) => e[field]).filter((v): v is string => !!v));
  if (values.size === 0) return '';
  if (values.size === 1) return [...values][0];
  return 'Multiple';
}

export function rollupErp(entries: ProjectInterface[]): string {
  return rollupDistinct(entries, 'erp');
}

export function rollupClient(entries: ProjectInterface[]): string {
  return rollupDistinct(entries, 'clientName');
}

export function rollupSuppliers(entries: ProjectInterface[]): string[] {
  return entries.map((e) => e.supplier).filter(Boolean);
}

// Human-readable summary across the suppliers — 'Oscorp', 'Oscorp, Acme',
// or 'Oscorp, Acme, Globex +2'. '' when every entry's supplier is blank.
export function rollupSupplierSummary(entries: ProjectInterface[]): string {
  const named = rollupSuppliers(entries);
  if (named.length === 0) return '';
  if (named.length <= 3) return named.join(', ');
  return `${named.slice(0, 3).join(', ')} +${named.length - 3}`;
}

// Largest size across the suppliers — the project is at least this big.
export function rollupSize(entries: ProjectInterface[]): ProjectSizeEnum | null {
  let best: ProjectSizeEnum | null = null;
  for (const e of entries) {
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

export function rollupInterfacesTotal(entries: ProjectInterface[]): number {
  return entries.reduce((sum, e) => sum + e.masterDataInterfaces + e.transactionalInterfaces, 0);
}

export function rollupInboundTotal(entries: ProjectInterface[]): number {
  return entries.reduce((sum, e) => sum + e.inbound, 0);
}

export function rollupOutboundTotal(entries: ProjectInterface[]): number {
  return entries.reduce((sum, e) => sum + e.outbound, 0);
}

// Highest value among the suppliers — used for the risk metric bars.
export function rollupDataLayer(entries: ProjectInterface[]): number {
  return Math.max(0, ...entries.map((e) => e.dataLayer));
}

export function rollupUncertainties(entries: ProjectInterface[]): number {
  return Math.max(0, ...entries.map((e) => e.uncertainties));
}

// Earliest start to latest end across all supplier ranges, e.g. "20-70".
export function rollupRangeLabel(entries: ProjectInterface[]): string {
  let low = Infinity;
  let high = -Infinity;

  for (const e of entries) {
    const match = e.tentativeRangeDays?.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/);
    if (!match) continue;
    low = Math.min(low, Number(match[1]));
    high = Math.max(high, Number(match[2]));
  }

  return low === Infinity ? '' : `${low}-${high}`;
}
