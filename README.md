# Projects Estimation

Angular 22 app for Vroozi where admins create project estimations and assign them to employees, and employees edit the projects assigned to them. All data (projects, users, ERP systems, suppliers) currently comes from static JSON files bundled with the app. Users/auth are static (hardcoded) for now.

## Where the data lives

There is no backend yet. Every data source is a JSON file under [src/app/core/data/](src/app/core/data/), imported at build time by a thin `static-*.data.ts` wrapper of the same name that exposes it with its proper type:

| Data | JSON file | Wrapper |
|---|---|---|
| Projects | `projects.json` | `static-projects.data.ts` (`STATIC_PROJECTS`) |
| Users | `users.json` | `static-user.data.ts` (`STATIC_USERS`) |
| Auth copy (reset hints, error messages) | `auth.json` | `static-auth.data.ts` |
| ERP systems / suppliers pick-lists | `erp-suppliers.json` | `static-erp-suppliers.data.ts` (`ERP_SYSTEMS`, `SUPPLIERS`) |

`ProjectsStoreService` loads `STATIC_PROJECTS` into an in-memory signal on startup; add/edit/delete update that signal directly. **Nothing is written back to the JSON files or persisted anywhere** — changes last for the current session only. This is a deliberate stepping stone: the long-term plan is a MongoDB-backed API, and JSON is close enough in shape to that future document format that swapping the static imports for real HTTP calls later should be a small, contained change.

- A "project" is simply every entry sharing the same `projectName`; in the app each entry is one supplier row.
- Creating starts with a choice: **new project** or **add a supplier to an existing project** — the rest of the form is identical.

## Development

```bash
npm start      # dev server on http://localhost:4200
npm run build  # production build into dist/
npm test       # unit tests (vitest)
```

Note: `src/app/app.spec.ts` ("should render title") is a stale scaffold test and currently fails — unrelated to app features.
