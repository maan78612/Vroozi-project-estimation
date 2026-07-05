import { Pipe, PipeTransform } from '@angular/core';

/*
 * ──────────────────────────────────────────────────────────────────
 !  {{ name | initials }} → letters for a round avatar badge.
 *  "Sara Ahmed" → "SA", "Majid" → "M".
 *
 *  A pipe is a tiny formatter used inside templates. Angular only
 *  re-runs it when the input value changes, so it's cheaper than
 *  calling a component method on every screen update — and one pipe
 *  keeps every avatar in the app formatted the same way.
 * ──────────────────────────────────────────────────────────────────
 */
@Pipe({ name: 'initials' })
export class InitialsPipe implements PipeTransform {
  // First letter of the first word + first letter of the last word.
  transform(name: string | null | undefined): string {
    if (!name) return '';
    const parts = name.trim().split(/\s+/);
    const first = parts[0]?.[0] ?? '';
    const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
    return (first + last).toUpperCase();
  }
}
