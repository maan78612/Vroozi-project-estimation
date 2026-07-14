import { FeatureFlagInterface } from '../intefaces/form/feature-flag.interface';

/*
 * ──────────────────────────────────────────────────────────────────
 !  Shared complexity/risk flag definitions
 *
 *  Used by the project wizard's toggle steps and by the project
 *  list cards (to surface which flags are active at a glance).
 * ──────────────────────────────────────────────────────────────────
 */

export const COMPLEXITY_FLAGS: FeatureFlagInterface[] = [
  { key: 'customLogic', label: 'Custom Logic', hint: 'Non-standard business logic required' },
  { key: 'uiImpact', label: 'UI Impact', hint: 'User-facing interface changes needed' },
  { key: 'newApiOrBusinessFlows', label: 'New API / Flows', hint: 'New endpoints or business flows' },
  { key: 'integrations', label: 'Integrations', hint: 'Third-party system integrations' },
  { key: 'existingErp', label: 'Existing ERP', hint: 'Builds on an existing ERP setup' },
  { key: 'hyperCare', label: 'Hyper Care', hint: 'Extended post-launch support period' },
];

export const RISK_FLAGS: FeatureFlagInterface[] = [
  { key: 'clientDependency', label: 'Client Dependency', hint: 'External client actions block progress' },
  { key: 'reportingAnalytics', label: 'Reporting & Analytics', hint: 'Custom reports or dashboards needed' },
];
