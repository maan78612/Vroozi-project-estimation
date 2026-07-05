import { describe, expect, it } from 'vitest';
import { groupToRows, rowsToProjects } from './project-sheet.util';
import { ProjectInterface } from '../intefaces/form/project.interface';
import { ProjectSizeEnum } from '../../core/enums/project-size.enum';

const entry = (overrides: Partial<ProjectInterface>): ProjectInterface => ({
  projectName: 'HEB',
  erp: 'EDI SFTP',
  supplier: 'Daymark',
  masterDataInterfaces: 0,
  transactionalInterfaces: 6,
  customLogic: 'Yes',
  uiImpact: 'No',
  user: 'majid',
  newApiOrBusinessFlows: 'No',
  integrations: 'Yes',
  clientDependency: 'Yes',
  reportingAnalytics: 'No',
  dataLayer: 10,
  uncertainties: 20,
  inbound: 4,
  outbound: 2,
  existingErp: 'No',
  hyperCare: 'Yes',
  tentativeProjectSize: ProjectSizeEnum.XXL,
  tentativeRangeDays: '45-65',
  ...overrides,
});

describe('project-sheet util', () => {
  it('writes the project name only on the first row of a group', () => {
    const rows = groupToRows([
      entry({ supplier: 'Daymark' }),
      entry({ supplier: 'Siffron', transactionalInterfaces: 7 }),
    ]);

    expect(rows).toHaveLength(2);
    expect(rows[0][0]).toBe('HEB');
    expect(rows[1][0]).toBe(''); // grouped under the row above
    // each row keeps its own data
    expect(rows[0][4]).toBe(6);
    expect(rows[1][4]).toBe(7);
    expect(rows[1][2]).toBe('Siffron');
  });

  it('round-trips a group, giving every entry the project name back', () => {
    const group = [
      entry({ supplier: 'Daymark' }),
      entry({ supplier: 'Siffron', inbound: 9, tentativeProjectSize: ProjectSizeEnum.M, tentativeRangeDays: '25-30' }),
    ];

    expect(rowsToProjects(groupToRows(group))).toEqual(group);
  });

  it('keeps separate projects apart', () => {
    const rows = [
      ...groupToRows([entry({ supplier: 'Daymark' }), entry({ supplier: 'Siffron' })]),
      ...groupToRows([entry({ projectName: 'Vasa', supplier: 'Muscle Foods' })]),
    ];

    const entries = rowsToProjects(rows);
    expect(entries.map((e) => `${e.projectName}/${e.supplier}`)).toEqual([
      'HEB/Daymark',
      'HEB/Siffron',
      'Vasa/Muscle Foods',
    ]);
  });

  it('handles an entry without a supplier', () => {
    const group = [entry({ supplier: '' })];
    expect(rowsToProjects(groupToRows(group))).toEqual(group);
  });

  it('derives the size tag when the sheet cell is blank', () => {
    const rows = groupToRows([entry({ tentativeProjectSize: undefined })]);
    const [parsed] = rowsToProjects(rows);
    expect(parsed.tentativeProjectSize).toBe(ProjectSizeEnum.XXL); // from "45-65"
  });
});
