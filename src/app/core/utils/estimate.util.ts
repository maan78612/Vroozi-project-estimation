import { ProjectInterface, YesNo } from '../intefaces/form/project.interface';

/*
 * ──────────────────────────────────────────────────────────────────
 !  Tentative day range — derived client-side from the form's inputs
 *
 *  Drives the live preview in the form (Review step) and the value
 *  saved into the project entry.
 * ──────────────────────────────────────────────────────────────────
 */

export type EstimateInput = Pick<
  ProjectInterface,
  | 'masterDataInterfaces'
  | 'transactionalInterfaces'
  | 'customLogic'
  | 'uiImpact'
  | 'newApiOrBusinessFlows'
  | 'integrations'
  | 'clientDependency'
  | 'reportingAnalytics'
  | 'dataLayer'
  | 'uncertainties'
  | 'existingErp'
  | 'hyperCare'
>;

// The Review step (and the Edit page's live sidebar) show the range plus
// the intermediate numbers it's built from — all derived from the same
// `effort`/`buffer` calculation, just not thrown away this time.
export interface EstimateBreakdown {
  range: string;
  min: number;
  max: number;
  baseEffortDays: number;
  riskBufferDays: number;
  complexityMultiplier: number;
}

function isYes(v: YesNo): boolean {
  return v === 'Yes';
}

// Data Layer / Uncertainties are stored as plain 0–100 numbers, not 0–1 fractions.
function toFraction(v: number): number {
  if (!v) return 0;
  return v > 1 ? v / 100 : v;
}

export function estimateRangeDays(input: EstimateInput): EstimateBreakdown {
  const base = 5;
  const interfaces = (input.masterDataInterfaces || 0) + (input.transactionalInterfaces || 0);

  const yesEffort =
    (isYes(input.customLogic) ? 3 : 0) +
    (isYes(input.uiImpact) ? 2 : 0) +
    (isYes(input.newApiOrBusinessFlows) ? 3 : 0) +
    (isYes(input.integrations) ? 2 : 0) +
    (isYes(input.clientDependency) ? 2 : 0) +
    (isYes(input.reportingAnalytics) ? 3 : 0) +
    (isYes(input.hyperCare) ? 2 : 0);

  const erpMultiplier = isYes(input.existingErp) ? 0.7 : 1.4;
  const dataLayer = toFraction(input.dataLayer);
  const uncertainties = toFraction(input.uncertainties);
  const complexityMultiplier = erpMultiplier * (1 + dataLayer) * (1 + uncertainties);

  const effort = (base + 1.5 * interfaces + yesEffort) * complexityMultiplier;
  const buffer = (effort <= 20 ? 5 : 10) + effort * 0.25;

  const min = Math.ceil(effort / 5) * 5;
  const max = Math.ceil((effort + buffer) / 5) * 5;

  return {
    range: `${min}-${max}`,
    min,
    max,
    baseEffortDays: min,
    riskBufferDays: max - min,
    complexityMultiplier: Math.round(complexityMultiplier * 100) / 100,
  };
}

/*
 * ──────────────────────────────────────────────────────────────────
 !  AI-assisted estimate — the tentative range reduced by the admin's
 *  global AI efficiency % (e.g. 50-70 days at 30% → 35-49 days).
 *  Percentage is validated 0-100 on both ends; a 0% is a no-op (same
 *  range, unrounded difference).
 * ──────────────────────────────────────────────────────────────────
 */
export function applyAiEfficiency(
  breakdown: Pick<EstimateBreakdown, 'min' | 'max'>,
  percentage: number,
): { range: string; min: number; max: number } {
  const factor = 1 - percentage / 100;
  const min = Math.max(1, Math.round(breakdown.min * factor));
  const max = Math.max(min, Math.round(breakdown.max * factor));
  return { range: `${min}-${max}`, min, max };
}
