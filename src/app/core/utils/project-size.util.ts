import { ProjectSizeEnum } from '../enums/project-size.enum';

/*
 * ──────────────────────────────────────────────────────────────────
 !  Mirrors the ESTIMATE_SIZE() Apps Script formula that used to run in
 *  the sheet, so the size tag is computed client-side as the user enters
 *  the tentative day range (e.g. "45-60").
 * ──────────────────────────────────────────────────────────────────
 */
export function estimateProjectSize(rangeStr: string | null | undefined): ProjectSizeEnum | null {
  if (!rangeStr) return null;

  const parts = rangeStr.split('-');
  if (parts.length !== 2) return null;

  const maxVal = parseFloat(parts[1].trim());
  if (isNaN(maxVal)) return null;

  if (maxVal <= 20) return ProjectSizeEnum.S;
  if (maxVal <= 30) return ProjectSizeEnum.M;
  if (maxVal <= 50) return ProjectSizeEnum.L;
  if (maxVal <= 60) return ProjectSizeEnum.XL;
  return ProjectSizeEnum.XXL;
}
