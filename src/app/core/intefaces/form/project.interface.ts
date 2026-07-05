import { ProjectSizeEnum } from '../../enums/project-size.enum';

export type YesNo = 'Yes' | 'No';

/*
 * One entry = one supplier row in the spreadsheet, carrying its own
 * full data. A project (e.g. "HEB") is simply every entry sharing the
 * same projectName.
 */
export interface ProjectInterface {
  projectName: string; // groups entries into a project; column A in the sheet
  erp: string;
  supplier: string; // this entry's supplier — may be empty
  masterDataInterfaces: number;
  transactionalInterfaces: number;
  customLogic: YesNo;
  uiImpact: YesNo;
  user: string; // username of the employee this project is assigned to
  newApiOrBusinessFlows: YesNo;
  integrations: YesNo;
  clientDependency: YesNo;
  reportingAnalytics: YesNo;
  dataLayer: number;
  uncertainties: number;
  inbound: number;
  outbound: number;
  existingErp: YesNo;
  hyperCare: YesNo;

  /*
   * ──────────────────────────────────────────────────────────────────
   !  tentativeRangeDays is entered by the user (e.g. "45-60"); tentativeProjectSize
   *  is derived from it client-side via estimateProjectSize() — see project-size.util.ts
   * ──────────────────────────────────────────────────────────────────
   */
  tentativeRangeDays?: string;
  tentativeProjectSize?: ProjectSizeEnum;
}
