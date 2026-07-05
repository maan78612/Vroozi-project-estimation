import { ProjectInterface } from '../intefaces/form/project.interface';

/*
 * ──────────────────────────────────────────────────────────────────
 !  Groups supplier entries into projects for the list pages.
 *  One group = one card; its entries are the project's supplier rows.
 * ──────────────────────────────────────────────────────────────────
 */

export interface ProjectGroup {
  projectName: string;
  entries: ProjectInterface[];
}

// Keeps the incoming order: a group appears where its first entry did,
// so the lists' sort options keep working on grouped cards.
export function groupProjects(entries: ProjectInterface[]): ProjectGroup[] {
  const groups = new Map<string, ProjectGroup>();

  for (const entry of entries) {
    const group = groups.get(entry.projectName);
    if (group) {
      group.entries.push(entry);
    } else {
      groups.set(entry.projectName, { projectName: entry.projectName, entries: [entry] });
    }
  }

  return Array.from(groups.values());
}
