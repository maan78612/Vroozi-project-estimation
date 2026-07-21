import { EMPTY, Observable, expand, reduce } from 'rxjs';
import { PaginationMeta } from '../intefaces/api.interface';

/*
 * ──────────────────────────────────────────────────────────────────
 !  Follows a paginated list endpoint to the end and flattens it.
 *
 *  Every list endpoint caps a single request at 100 rows server-side
 *  (see the backend's queryFeatures maxLimit) — callers that treated
 *  one `limit: 100` request as "everything" silently lost data past
 *  row 100. This walks meta.page/meta.totalPages until there's
 *  nothing left, so the caller always gets the full set.
 * ──────────────────────────────────────────────────────────────────
 */

// Hard stop after this many pages (2000 rows at 100/page) so a runaway
// dataset degrades to "truncated + a console warning," never a hung tab.
const MAX_PAGES = 20;

export interface Page<T> {
  items: T[];
  meta?: PaginationMeta;
}

export function fetchAllPages<T>(fetchPage: (page: number) => Observable<Page<T>>): Observable<T[]> {
  return fetchPage(1).pipe(
    expand((page) => {
      const meta = page.meta;
      if (!meta?.totalPages || meta.page >= meta.totalPages) return EMPTY;
      if (meta.page >= MAX_PAGES) {
        console.warn(
          `fetchAllPages: stopped at page ${meta.page}/${meta.totalPages} (safety cap) — ` +
            `${meta.total} total rows exist.`,
        );
        return EMPTY;
      }
      return fetchPage(meta.page + 1);
    }),
    reduce((all, page) => all.concat(page.items), [] as T[]),
  );
}
