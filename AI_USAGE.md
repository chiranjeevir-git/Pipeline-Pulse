# AI usage

## Tools used

Cursor, with Grok 4.7.

## Where

The React frontend under `frontend/` was generated in Cursor from the Pipeline Pulse brief. That includes the API client, page state, views, styles, tests, and the frontend container files. The tracked `README.md` and `Notes.md` files were rewritten for this frontend slice. Backend files (`pom.xml`, `src/`, Maven wrapper) were not edited.

## Prompts

1. Implement only the frontend of Pipeline Pulse from `/Users/cr001/Downloads/ep copy.docx`, following the routes, states, teardown rules, and `data-testid` values in that document.
2. Routes: `/` pipelines with inline create, rename, and delete; `/pipelines/:id` runs with status filter, load more, and create-run; `/runs/:id` detail with live status, notes, and Start / Pass / Fail / Mark flaky.
3. Every data view needs a loading, empty, and error state. Tear down live subscriptions, timers, and in-flight requests on navigation. Keep API access, state, and presentation separable.
4. Required test ids: `pipeline-row`, `pipeline-create`, `run-row`, `run-status-badge`, `run-load-more`, `note-add`, `note-row`, `nav-home`. Usable at 375px and 1440px. TypeScript, served on port 3000.
5. Keep all frontend work on a `frontend` branch so it is not mixed with backend work on `main`. Do not commit unless asked.

## What changed

- Delete stays a single inline button. A confirmation dialog was dropped so create, rename, and delete all happen on the row without a second control the brief does not name.
- `GET /pipelines` is parsed as a JSON array. Run history is parsed as `{ items, nextCursor }`. A wrapper object around pipelines was rejected because the brief describes a list, while only runs are paginated.
- After a pipeline create, an in-flight list response is ignored and the list is refreshed. The first version could overwrite the new row with a list request that started before the create finished.

## Verification

Unit and component tests cover formatting, the idempotency key, error envelopes, request cancellation, the status stream closing on unmount, load more, filters, and note add. `npm test` and `npm run typecheck` were run in `frontend/`. The UI was also exercised in a browser against a temporary local API at 375px and 1440px.

## Assistant Attestation

Model: Grok 4.7. Date: 2026-10-24.

Files generated or substantially edited:

- `frontend/` (application, tests, Dockerfile, nginx template)
- `.gitignore` (frontend build artifacts)
- `README.md`
- `Notes.md`
- `AI_USAGE.md`
