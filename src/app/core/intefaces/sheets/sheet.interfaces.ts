/*
 * ──────────────────────────────────────────────────────────────────
 !  Google Sheets request / response contracts
 *
 *  Every HTTP call to the Apps Script endpoint uses one of these
 *  request shapes. The endpoint reads `action` first and then
 *  handles the rest of the payload accordingly.
 * ──────────────────────────────────────────────────────────────────
 */

// One spreadsheet row, ordered A → T to match entryToRow() in project-sheet.util.ts.
export type SheetRow = (string | number)[];

/*
 * A project is a block of rows: the first row holds all the fields,
 * then one extra row per additional supplier (only column C filled) —
 * same layout as the original company sheet.
 */

// ── Requests ────────────────────────────────────────────────────

export interface SheetReadRequest {
  action: 'read';
  spreadsheetId: string;
}

export interface SheetAppendRequest {
  action: 'append';
  spreadsheetId: string;
  rows: SheetRow[]; // one project block
}

export interface SheetUpdateRequest {
  action: 'update';
  spreadsheetId: string;
  rowKey: string; // project name — used to find the block's first row
  rows: SheetRow[];
}

export interface SheetDeleteRequest {
  action: 'delete';
  spreadsheetId: string;
  rowKey: string; // removes the whole block
}

export type SheetRequest =
  | SheetReadRequest
  | SheetAppendRequest
  | SheetUpdateRequest
  | SheetDeleteRequest;

// ── Responses ───────────────────────────────────────────────────

// `read` answers with SheetRow[] (raw rows, header excluded); writes answer with no data.
export interface SheetResponse<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}
