import { ProjectSizeEnum } from '../../enums/project-size.enum';

export type YesNo = 'Yes' | 'No';

/*
 * One entry = one supplier row, carrying its own full data. A project
 * (e.g. "HEB") is simply every entry sharing the same projectName.
 */
export interface ProjectInterface {
  id?: string; // MongoDB _id — absent only before the first save
  projectName: string; // groups entries into a project
  erp: string;
  supplier: string; // this entry's supplier — may be empty
  masterDataInterfaces: number;
  transactionalInterfaces: number;
  customLogic: YesNo;
  uiImpact: YesNo;
  user: string; // id of the employee (owner) this project is assigned to
  userName?: string; // owner's display name, populated by the API
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
