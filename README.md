# Projects Estimation

Angular 22 app for Vroozi where admins create project estimations and assign them to employees, and employees edit the projects assigned to them. All project data lives in one shared Google Sheet. Users/auth are static (hardcoded) for now.

## How the app talks to Google Sheets

```
Angular app  ──POST (JSON as text/plain)──►  Apps Script web app  ──►  Google Sheet
```

- The Angular side never calls the Google Sheets API directly. It posts small JSON requests (`read` / `append` / `update` / `delete`) to a deployed Google Apps Script, which does the actual sheet work. See [google-apps-script/Code.gs](google-apps-script/Code.gs).
- Requests are sent as `text/plain` so the browser skips the CORS preflight, which Apps Script can't answer.
- The script URL and spreadsheet ID live in [src/app/core/config/google-sheets.config.ts](src/app/core/config/google-sheets.config.ts). **While either value is empty, the app runs on built-in sample data instead** — handy for development.

### Sheet layout (row per supplier)

One row per supplier, each carrying its own full data (columns A–T, matching `FORM_DATA`) — same as the original company sheet:

- A "project" is simply every row sharing the same project name; in the app each row is one supplier entry.
- Rows of a project sit together in a block. The project name (column A) is written once on the first row and merged down the block.
- Saves always send the project's whole block: adding a supplier, editing one, or renaming the project replaces the block in place.
- In the app, creating starts with a choice: **new project** or **add a supplier to an existing project** — the rest of the form is identical.

## One-time setup

### 1. Create the Apps Script project

1. Go to [script.google.com](https://script.google.com) and click **New project**.
2. Give it a name (e.g. "Vroozi Project").
3. Delete the default code and paste the full contents of [google-apps-script/Code.gs](google-apps-script/Code.gs). Save.

### 2. Create and seed the spreadsheet

1. In the toolbar function dropdown, pick **`setup`** and click **Run**.
2. Approve the permissions popup (the script needs access to create/edit your spreadsheets).
3. Open the execution log — it prints the **Spreadsheet ID** and URL. The new sheet ("Vroozi Projects Estimation") lands in the root of My Drive with the header row and all the rules and styling (dropdowns, colors, number formats) already applied — no data rows. Add the first project from the app.

> ⚠️ Run `setup()` only once — every run creates a **new** spreadsheet with a new ID. To re-apply styling to the sheet you already use, run `formatExistingSheet()` instead.

### 3. Deploy the script as a web app

1. Click **Deploy → New deployment**.
2. Type: **Web app**.
3. **Execute as: Me** — the script edits the sheet with your permissions, so app users don't need Google accounts.
4. **Who has access: Anyone** — required so the browser can call it without OAuth. Anyone with the URL can hit it, which is acceptable while the app itself uses static auth.
5. Deploy and copy the **/exec URL**.

### 4. Connect the Angular app

Paste both values into `src/app/core/config/google-sheets.config.ts`:

```ts
export const GOOGLE_SHEETS_CONFIG = {
  scriptUrl: 'https://script.google.com/macros/s/XXXX/exec',
  spreadsheetId: '1AbC...',
};
```

Then `ng serve` — the app now reads and writes the sheet.

## Updating the script later

Saving the file in the Apps Script editor is **not** enough for the live URL:

- Changed `doPost` / request handling? **Deploy → Manage deployments → ✏️ edit → Version: New version → Deploy.** The /exec URL stays the same.
- Helper functions run from the editor (`setup`, `formatExistingSheet`) always use the saved code — no redeploy needed for those.

Handy one-time helper in `Code.gs` (takes the ID from `EXISTING_SPREADSHEET_ID` at the top of the file — keep it equal to the config's `spreadsheetId`):

- **`formatExistingSheet()`** — re-applies dropdowns, number formats and colors to an existing sheet. Touches no data.

## Why a standalone script (not Extensions → Apps Script)

There are two kinds of Apps Script projects:

| | Standalone (what we use) | Container-bound |
|---|---|---|
| Created from | script.google.com | A spreadsheet → Extensions → Apps Script |
| Lives | As its own file in Drive | Inside that one spreadsheet |
| Reaches the sheet | By ID: `SpreadsheetApp.openById(...)` | Only its own sheet |

We use a **standalone** script because:

- It is not tied to one spreadsheet — every request carries a `spreadsheetId`, so the same deployed script can serve a new or different sheet by only changing the config, without touching code or the deployment URL.
- The web app URL stays stable even if the spreadsheet is replaced.
- The code lives in this repo and is pasted into one visible Drive file, instead of hiding inside a spreadsheet's Extensions menu.

Because of this, opening the spreadsheet → **Extensions → Apps Script shows an empty project — that's normal.** The backend code lives in the standalone Drive file, not in the sheet.

## Development

```bash
npm start      # dev server on http://localhost:4200
npm run build  # production build into dist/
npm test       # unit tests (vitest)
```

Note: `src/app/app.spec.ts` ("should render title") is a stale scaffold test and currently fails — unrelated to app features.
