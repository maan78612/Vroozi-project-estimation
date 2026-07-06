import { ProjectInterface, YesNo } from '../intefaces/form/project.interface';

/*
 * ──────────────────────────────────────────────────────────────────
 !  Tentative day range — mirrors Code.gs's estimateRangeDays()
 *
 *  Both ends must stay in lockstep with the Apps Script backend,
 *  which is the source of truth once saved: this client copy only
 *  drives the live preview in the form (Review step + optimistic
 *  local updates) before the sheet round-trips.
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

function isYes(v: YesNo): boolean {
  return v === 'Yes';
}

// Data Layer / Uncertainties are stored as plain 0–100 numbers, not 0–1 fractions.
function toFraction(v: number): number {
  if (!v) return 0;
  return v > 1 ? v / 100 : v;
}

export function estimateRangeDays(input: EstimateInput): string {
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

  const effort =
    (base + 1.5 * interfaces + yesEffort) * erpMultiplier * (1 + dataLayer) * (1 + uncertainties);
  const buffer = (effort <= 20 ? 5 : 10) + effort * 0.25;

  const min = Math.ceil(effort / 5) * 5;
  const max = Math.ceil((effort + buffer) / 5) * 5;

  return `${min}-${max}`;
}
