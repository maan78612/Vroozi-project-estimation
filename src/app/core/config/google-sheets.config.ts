/*
 * ──────────────────────────────────────────────────────────────────
 !  Google Sheets connection settings
 *
 *  Fill both values after deploying google-apps-script/Code.gs
 *  (steps are at the top of that file). While either one is empty
 *  the app quietly falls back to the built-in sample data.
 * ──────────────────────────────────────────────────────────────────
 */
export const GOOGLE_SHEETS_CONFIG = {
  // The Apps Script web app /exec URL from "Deploy → New deployment".
  scriptUrl:
    'https://script.google.com/macros/s/AKfycbzo_YiE8Fw4ruCw_cPgT2puhjqdVHh-g7CtnArCRvrDRhUqlBC7aH5bhr7MWbNQKRzn/exec',

  // The spreadsheet ID that setup() logs (also visible in the sheet URL).
  spreadsheetId: '187v4INp1MLdKTCDiTvGsSE6dCiCyB2TyC83sVrMj-fo',
};
