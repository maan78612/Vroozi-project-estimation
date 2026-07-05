import { ProjectInterface } from '../intefaces/form/project.interface';
import { ProjectSizeEnum } from '../enums/project-size.enum';

export type ProjectSortOption = 'name' | 'size' | 'range';

export const PROJECT_SIZE_ORDER = [
  ProjectSizeEnum.S,
  ProjectSizeEnum.M,
  ProjectSizeEnum.L,
  ProjectSizeEnum.XL,
  ProjectSizeEnum.XXL,
];

function sizeRank(size?: ProjectSizeEnum): number {
  return size ? PROJECT_SIZE_ORDER.indexOf(size) : -1;
}

function rangeStart(range?: string): number {
  const match = range?.match(/\d+/);
  return match ? Number(match[0]) : 0;
}

// Shared by the admin and employee project lists so "sort by" always behaves the same way.
export function sortProjects(
  projects: ProjectInterface[],
  sortBy: ProjectSortOption,
): ProjectInterface[] {
  const sorted = [...projects];

  if (sortBy === 'name') {
    sorted.sort((a, b) => a.projectName.localeCompare(b.projectName));
  } else if (sortBy === 'size') {
    sorted.sort((a, b) => sizeRank(b.tentativeProjectSize) - sizeRank(a.tentativeProjectSize));
  } else if (sortBy === 'range') {
    sorted.sort((a, b) => rangeStart(b.tentativeRangeDays) - rangeStart(a.tentativeRangeDays));
  }

  return sorted;
}
