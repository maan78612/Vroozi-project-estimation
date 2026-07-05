import { Pipe, PipeTransform } from '@angular/core';

/*
 * ──────────────────────────────────────────────────────────────────
 !  {{ items | listSummary }}   → join everything: "A, B, C, D"
 *  {{ items | listSummary:2 }} → cap at 2 names:  "A, B +2"
 *  Empty list → "—".
 *
 *  Used for supplier lists: project cards cap at 2 so a
 *  many-supplier project doesn't blow up the card; the review
 *  step shows the full list.
 * ──────────────────────────────────────────────────────────────────
 */
@Pipe({ name: 'listSummary' })
export class ListSummaryPipe implements PipeTransform {
  transform(items: string[] | null | undefined, maxVisible = Infinity): string {
    if (!items || items.length === 0) return '—';
    const visible = items.slice(0, maxVisible).join(', ');
    const hidden = items.length - maxVisible;
    return hidden > 0 ? `${visible} +${hidden}` : visible;
  }
}
