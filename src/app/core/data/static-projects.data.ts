import { ProjectInterface } from '../intefaces/form/project.interface';
import projectsJson from './projects.json';

/*
 * ──────────────────────────────────────────────────────────────────
 !  Static project data — temporary stand-in for the future MongoDB
 *  collection. One entry per supplier row; entries sharing a
 *  projectName belong to the same project. `user` is the username of
 *  the employee (from STATIC_USERS) it's assigned to.
 * ──────────────────────────────────────────────────────────────────
 */

export const STATIC_PROJECTS: ProjectInterface[] = projectsJson as ProjectInterface[];
