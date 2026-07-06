/*
 * ──────────────────────────────────────────────────────────────────
 !  Google Sheets backend for the Projects Estimation app
 *
 *  One-time setup:
 *  1. Go to script.google.com → New project → paste this file.
 *  2. Pick setup() in the toolbar and Run it once (approve the
 *     permissions popup). Open View → Logs and copy the
 *     spreadsheet ID.
 *  3. Deploy → New deployment → type: Web app →
 *     Execute as: Me, Who has access: Anyone → Deploy.
 *     Copy the /exec URL.
 *  4. Paste the /exec URL and the spreadsheet ID into
 *     src/app/core/config/google-sheets.config.ts
 *
 *  After editing this file, saving is not enough — create a new
 *  deployment version (Deploy → Manage deployments → edit →
 *  New version) or the /exec URL keeps serving the old code.
 *
 !  Row layout: one row per supplier, each carrying its own full
 *  data. Rows of the same project sit together in a block; the
 *  project name (column A) is written once on the first row and
 *  merged down the block, same as the original company sheet.
 * ──────────────────────────────────────────────────────────────────
 */

var SHEET_NAME = 'Projects';

// Column order A → T — must match entryToRow() in project-sheet.util.ts.
var HEADERS = [
  'Projects',
  'ERP',
  'Supplier',
  'Master Data Interface',
  'Transactional Interfaces',
  'Custom Logic',
  'UI Impact',
  'User',
  'New API Or Business Flows',
  'Integrations',
  'Client Dependency',
  'Reporting/Analytics',
  'Data Layer',
  'Uncertainties',
  'Inbound',
  'Outbound',
  'Existing ERP',
  'Hyper Care',
  'Tentative Project Size',
  'Tentative Range (Days)',
];

// Columns that hold small counts — shown as numeric dropdowns like the company sheet.
var NUMBER_DROPDOWN_COLUMNS = ['D', 'E', 'O', 'P'];
var NUMBER_DROPDOWN_MAX = 25;

// Columns holding Yes/No answers.
var YES_NO_COLUMNS = ['F', 'G', 'I', 'J', 'K', 'L', 'Q', 'R'];

// Background color per project size (column S), matching the company sheet.
var SIZE_COLORS = {
  S: '#f4cccc', // red
  M: '#fce5cd', // orange
  L: '#fff2cc', // yellow
  XL: '#d9ead3', // green
  XXL: '#cfe2f3', // blue
};

var YES_COLOR = '#d9ead3';
var NO_COLOR = '#f4cccc';

// Columns the backend always computes (S, T) — protected so nobody hand-edits them.
var COMPUTED_COLUMNS_RANGE = 'S2:T';
var COMPUTED_COLUMNS_PROTECTION_DESC = 'Auto-calculated by the app — do not edit directly';

/*
 * ──────────────────────────────────────────────────────────────────
 !  Run once from the editor: creates the spreadsheet with the header
 *  row, dropdowns, colors and number formats — no data rows. Add
 *  projects from the app. Logs the ID + URL.
 *
 !  Every run makes a NEW spreadsheet with a new ID. Don't re-run it
 *  on an existing setup — use formatExistingSheet() to re-style the
 *  sheet you already have.
 * ──────────────────────────────────────────────────────────────────
 */
function setup() {
  var ss = SpreadsheetApp.create('Vroozi Projects Estimation');
  var sheet = ss.getSheets()[0].setName(SHEET_NAME);

  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold');
  sheet.setFrozenRows(1);

  formatSheet(sheet);

  Logger.log('Spreadsheet ID: ' + ss.getId());
  Logger.log('Spreadsheet URL: ' + ss.getUrl());
}

/*
 * ──────────────────────────────────────────────────────────────────
 !  Run once from the editor to re-style a spreadsheet that already
 *  exists (dropdowns, colors, number formats). Touches no data.
 * ──────────────────────────────────────────────────────────────────
 */
// Keep this equal to spreadsheetId in google-sheets.config.ts,
// otherwise this helper works on a different sheet than the app.
var EXISTING_SPREADSHEET_ID = '187v4INp1MLdKTCDiTvGsSE6dCiCyB2TyC83sVrMj-fo';

function formatExistingSheet() {
  formatSheet(openSheet(EXISTING_SPREADSHEET_ID));
  logTouchedSheet('Formatted');
}

function formatSheet(sheet) {
  // Numeric dropdowns (0–25) for the interface / inbound / outbound counts.
  var numbers = [];
  for (var n = 0; n <= NUMBER_DROPDOWN_MAX; n++) numbers.push(String(n));
  var numberRule = SpreadsheetApp.newDataValidation().requireValueInList(numbers, true).build();
  NUMBER_DROPDOWN_COLUMNS.forEach(function (col) {
    sheet.getRange(col + '2:' + col).setDataValidation(numberRule);
  });

  // Yes/No dropdowns.
  var yesNoRule = SpreadsheetApp.newDataValidation().requireValueInList(['Yes', 'No'], true).build();
  YES_NO_COLUMNS.forEach(function (col) {
    sheet.getRange(col + '2:' + col).setDataValidation(yesNoRule);
  });

  // Data Layer + Uncertainties stay plain numbers — no % symbol.
  sheet.getRange('M2:N').setNumberFormat('0');

  // Day-range column stays plain text so "5-10" never turns into a date.
  sheet.getRange('T:T').setNumberFormat('@');

  // Color rules: size chips in column S, green Yes / red No everywhere else.
  // Added on top of any rules the sheet already has.
  var rules = sheet.getConditionalFormatRules();

  Object.keys(SIZE_COLORS).forEach(function (size) {
    rules.push(
      SpreadsheetApp.newConditionalFormatRule()
        .whenTextEqualTo(size)
        .setBackground(SIZE_COLORS[size])
        .setRanges([sheet.getRange('S2:S')])
        .build(),
    );
  });

  YES_NO_COLUMNS.forEach(function (col) {
    var range = sheet.getRange(col + '2:' + col);
    rules.push(
      SpreadsheetApp.newConditionalFormatRule()
        .whenTextEqualTo('Yes')
        .setBackground(YES_COLOR)
        .setRanges([range])
        .build(),
    );
    rules.push(
      SpreadsheetApp.newConditionalFormatRule()
        .whenTextEqualTo('No')
        .setBackground(NO_COLOR)
        .setRanges([range])
        .build(),
    );
  });

  sheet.setConditionalFormatRules(rules);

  protectComputedColumns(sheet);
}

/*
 * ──────────────────────────────────────────────────────────────────
 !  Tentative Project Size (S) and Tentative Range (T) are always
 *  written by writeBlock() below — collaborators can't hand-edit
 *  them in the Sheets UI. The script itself (running as the sheet
 *  owner) can still write to a protected range, so this doesn't
 *  block appends/updates.
 * ──────────────────────────────────────────────────────────────────
 */
function protectComputedColumns(sheet) {
  var protections = sheet.getProtections(SpreadsheetApp.ProtectionType.RANGE);
  for (var i = 0; i < protections.length; i++) {
    if (protections[i].getDescription() === COMPUTED_COLUMNS_PROTECTION_DESC) return; // already protected
  }

  var protection = sheet.getRange(COMPUTED_COLUMNS_RANGE).protect();
  protection.setDescription(COMPUTED_COLUMNS_PROTECTION_DESC);
  protection.removeEditors(protection.getEditors());
  if (protection.canDomainEdit()) protection.setDomainEdit(false);
}

/*
 * ──────────────────────────────────────────────────────────────────
 !  Every app request lands here as JSON inside a plain-text POST.
 *  Response shape: { success, data?, error? }
 * ──────────────────────────────────────────────────────────────────
 */
function doPost(e) {
  // One request at a time so two saves can't write over each other.
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var req = JSON.parse(e.postData.contents);
    return respond({ success: true, data: handleRequest(req) });
  } catch (err) {
    return respond({ success: false, error: err && err.message ? err.message : String(err) });
  } finally {
    lock.releaseLock();
  }
}

function handleRequest(req) {
  var sheet = openSheet(req.spreadsheetId);
  // Older app versions sent a single `row` — treat it as a one-row block.
  var rows = req.rows || (req.row ? [req.row] : null);

  switch (req.action) {
    case 'read':
      // All rows below the header, as raw values. Merged cells come
      // back empty except the top one, which is what the app expects.
      return sheet.getDataRange().getValues().slice(1);

    case 'append':
      appendBlock(sheet, rows);
      return null;

    case 'update':
      var startRow = findRowByKey(sheet, req.rowKey);
      if (startRow === -1) {
        appendBlock(sheet, rows); // no matching project — save it as new
      } else {
        replaceBlock(sheet, startRow, rows);
      }
      return null;

    case 'delete':
      var deleteRow = findRowByKey(sheet, req.rowKey);
      if (deleteRow === -1) throw new Error('Project not found: ' + req.rowKey);
      sheet.deleteRows(deleteRow, blockLength(sheet, deleteRow));
      return null;

    default:
      throw new Error('Unknown action: ' + req.action);
  }
}

/*
 * ──────────────────────────────────────────────────────────────────
 !  Block helpers — one project = one block of rows
 * ──────────────────────────────────────────────────────────────────
 */

// How many rows the project at startRow spans: its own row plus
// every row below whose column A is empty.
function blockLength(sheet, startRow) {
  var lastRow = sheet.getLastRow();
  if (startRow >= lastRow) return 1;

  var names = sheet.getRange(startRow + 1, 1, lastRow - startRow, 1).getValues();
  var length = 1;
  for (var i = 0; i < names.length && String(names[i][0]).trim() === ''; i++) length++;
  return length;
}

function appendBlock(sheet, rows) {
  writeBlock(sheet, sheet.getLastRow() + 1, rows);
}

function replaceBlock(sheet, startRow, rows) {
  sheet.deleteRows(startRow, blockLength(sheet, startRow));
  sheet.insertRowsBefore(startRow, rows.length);
  writeBlock(sheet, startRow, rows);
}

function writeBlock(sheet, startRow, rows) {
  // Tentative Project Size (S) and Tentative Range (T) are never trusted
  // from the client — always recomputed here from the row's own D–R values.
  rows.forEach(function (row) {
    var range = estimateRangeDays(row);
    row[18] = estimateSize(range);
    row[19] = range;
  });

  sheet.getRange(startRow, 1, rows.length, rows[0].length).setValues(rows);
  mergeBlockHead(sheet, startRow, rows.length);
}

// Shows the project name once per block, like the company sheet.
// Only column A merges — every other column holds per-supplier data.
// Sheets "Tables" don't allow merges — data is still correct without it.
function mergeBlockHead(sheet, startRow, rowCount) {
  if (rowCount < 2) return;
  try {
    sheet.getRange(startRow, 1, rowCount, 1).mergeVertically();
  } catch (ignore) {}
}

// Prints which spreadsheet a helper worked on, so runs are never ambiguous.
function logTouchedSheet(action) {
  var ss = SpreadsheetApp.openById(EXISTING_SPREADSHEET_ID);
  Logger.log(action + ' "' + ss.getName() + '" — ID: ' + ss.getId() + ' — ' + ss.getUrl());
}

function openSheet(spreadsheetId) {
  if (!spreadsheetId) throw new Error('spreadsheetId is missing');
  var ss = SpreadsheetApp.openById(spreadsheetId);
  return ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
}

// 1-based sheet row whose column A matches rowKey, or -1 if none.
function findRowByKey(sheet, rowKey) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;

  var keys = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (var i = 0; i < keys.length; i++) {
    if (String(keys[i][0]).trim() === String(rowKey).trim()) return i + 2;
  }
  return -1;
}

/*
 * ──────────────────────────────────────────────────────────────────
 !  Tentative size + day range — ported from the company sheet's old
 *  ESTIMATE() / ESTIMATE_SIZE() formulas (once live spreadsheet
 *  formulas), remapped to this sheet's column layout and run here
 *  instead so every append/update writes plain computed values.
 *
 *  row is a full 20-column array (A → T, 0-indexed 0 → 19):
 *  3=Master Data, 4=Transactional, 5=Custom Logic, 6=UI Impact,
 *  8=New API/Flows, 9=Integrations, 10=Client Dependency,
 *  11=Reporting/Analytics, 12=Data Layer, 13=Uncertainties,
 *  16=Existing ERP, 17=Hyper Care.
 * ──────────────────────────────────────────────────────────────────
 */
function isYesValue(v) {
  return String(v || '').trim().toLowerCase() === 'yes';
}

function toPercent(v) {
  var s = String(v || '').replace('%', '').trim();
  var n = parseFloat(s);
  if (isNaN(n)) return 0;
  return n > 1 ? n / 100 : n;
}

function estimateRangeDays(row) {
  var base = 5;
  var interfaces = (Number(row[3]) || 0) + (Number(row[4]) || 0);

  var yesEffort =
    (isYesValue(row[5]) ? 3 : 0) + // Custom Logic
    (isYesValue(row[6]) ? 2 : 0) + // UI Impact
    (isYesValue(row[8]) ? 3 : 0) + // New API Or Business Flows
    (isYesValue(row[9]) ? 2 : 0) + // Integrations
    (isYesValue(row[10]) ? 2 : 0) + // Client Dependency
    (isYesValue(row[11]) ? 3 : 0) + // Reporting/Analytics
    (isYesValue(row[17]) ? 2 : 0); // Hyper Care

  var erpMultiplier = isYesValue(row[16]) ? 0.7 : 1.4; // Existing ERP
  var dataLayer = toPercent(row[12]);
  var uncertainties = toPercent(row[13]);

  var effort =
    (base + 1.5 * interfaces + yesEffort) * erpMultiplier * (1 + dataLayer) * (1 + uncertainties);
  var buffer = (effort <= 20 ? 5 : 10) + effort * 0.25;

  var min = Math.ceil(effort / 5) * 5;
  var max = Math.ceil((effort + buffer) / 5) * 5;

  return min + '-' + max;
}

function estimateSize(rangeStr) {
  var parts = String(rangeStr || '').split('-');
  if (parts.length !== 2) return '';

  var maxVal = parseFloat(parts[1]);
  if (isNaN(maxVal)) return '';

  if (maxVal <= 20) return 'S';
  if (maxVal <= 30) return 'M';
  if (maxVal <= 50) return 'L';
  if (maxVal <= 60) return 'XL';
  return 'XXL';
}

function respond(body) {
  return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
