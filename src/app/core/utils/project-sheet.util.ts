import { ProjectInterface, YesNo } from '../intefaces/form/project.interface';
import { ProjectSizeEnum } from '../enums/project-size.enum';
import { SheetRow } from '../intefaces/sheets/sheet.interfaces';
import { estimateProjectSize } from './project-size.util';

/*
 * ──────────────────────────────────────────────────────────────────
 !  Converts supplier entries to/from spreadsheet rows.
 *
 *  Column order is A → T, matching FORM_DATA and the sheet headers.
 *  Every row carries its own full data. The project name (column A)
 *  is written only on the first row of a project's group — the rows
 *  below it belong to the same project, like the company sheet.
 * ──────────────────────────────────────────────────────────────────
 */

export function entryToRow(entry: ProjectInterface): SheetRow {
  return [
    entry.projectName,
    entry.erp,
    entry.supplier,
    entry.masterDataInterfaces,
    entry.transactionalInterfaces,
    entry.customLogic,
    entry.uiImpact,
    entry.user,
    entry.newApiOrBusinessFlows,
    entry.integrations,
    entry.clientDependency,
    entry.reportingAnalytics,
    entry.dataLayer,
    entry.uncertainties,
    entry.inbound,
    entry.outbound,
    entry.existingErp,
    entry.hyperCare,
    entry.tentativeProjectSize ?? '',
    entry.tentativeRangeDays ?? '',
  ];
}

// All rows for one project. Every entry must share the same projectName;
// only the first row gets it (column A), the rest leave it blank.
export function groupToRows(entries: ProjectInterface[]): SheetRow[] {
  return entries.map((entry, index) => {
    const row = entryToRow(entry);
    if (index > 0) row[0] = '';
    return row;
  });
}

export function rowsToProjects(rows: SheetRow[]): ProjectInterface[] {
  const entries: ProjectInterface[] = [];
  let currentProjectName = '';

  for (const row of rows) {
    const name = String(row[0] ?? '').trim();
    if (name) currentProjectName = name;

    const entry = rowToEntry(row, currentProjectName);
    // Skip fully empty filler rows.
    if (!entry.projectName && !entry.supplier) continue;
    entries.push(entry);
  }

  return entries;
}

function rowToEntry(row: SheetRow, projectName: string): ProjectInterface {
  const text = (i: number) => String(row[i] ?? '').trim();
  const num = (i: number) => Number(row[i]) || 0;
  const yesNo = (i: number): YesNo => (text(i) === 'Yes' ? 'Yes' : 'No');

  const tentativeRangeDays = text(19);
  // If the size cell is blank, work it out from the day range like the form does.
  const tentativeProjectSize =
    (text(18) as ProjectSizeEnum) || estimateProjectSize(tentativeRangeDays) || undefined;

  return {
    projectName,
    erp: text(1),
    supplier: text(2),
    masterDataInterfaces: num(3),
    transactionalInterfaces: num(4),
    customLogic: yesNo(5),
    uiImpact: yesNo(6),
    user: text(7),
    newApiOrBusinessFlows: yesNo(8),
    integrations: yesNo(9),
    clientDependency: yesNo(10),
    reportingAnalytics: yesNo(11),
    dataLayer: num(12),
    uncertainties: num(13),
    inbound: num(14),
    outbound: num(15),
    existingErp: yesNo(16),
    hyperCare: yesNo(17),
    tentativeProjectSize,
    tentativeRangeDays,
  };
}
