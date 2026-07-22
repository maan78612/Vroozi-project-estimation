import { ProjectInterface } from '../intefaces/form/project.interface';

/*
 * ──────────────────────────────────────────────────────────────────
 !  Are two supplier entries functionally identical? Compares every
 *  field the form actually lets you set, except the id (identity, not
 *  content) and tentativeRangeDays/tentativeProjectSize (fully derived
 *  from the fields below, so comparing them too would be redundant).
 *
 *  Used to block saving an exact-duplicate supplier entry within the
 *  same project — most commonly hit by "Duplicate Supplier" landing
 *  straight back on Save with nothing changed. Two entries sharing a
 *  supplier name are NOT automatically a collision here — only when
 *  every other property matches too, so re-estimating a later phase
 *  with the same supplier (different interfaces/complexity) is fine.
 * ──────────────────────────────────────────────────────────────────
 */
const COMPARED_FIELDS: (keyof ProjectInterface)[] = [
  'projectScope',
  'erp',
  'edi',
  'supplier',
  'client',
  'user',
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
];

export function isExactDuplicateEntry(a: ProjectInterface, b: ProjectInterface): boolean {
  return COMPARED_FIELDS.every((key) => (a[key] ?? '') === (b[key] ?? ''));
}
