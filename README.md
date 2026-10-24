# Pipeline Pulse

Frontend for a pipeline run dashboard: what ran, what failed, and why.

This branch (`frontend`) contains the React UI only. The API and database are a separate slice and are not started by these commands.

## Run the UI

```bash
cd frontend
npm install
npm run dev
```

The app is served at <http://localhost:3000>. Vite proxies `/api` to `http://localhost:8080`, so the UI and the live status stream stay on the same origin.

```bash
cd frontend
npm test
npm run typecheck
```

A production image listens on port 3000 and proxies `/api/` to `API_UPSTREAM` (default `http://api:8080`, with no trailing slash):

```bash
docker build -t pipeline-pulse-frontend frontend
docker run --rm -p 3000:3000 -e API_UPSTREAM=http://host.docker.internal:8080 pipeline-pulse-frontend
```

## API contract this UI expects

All JSON, under `/api/v1`.

- `GET /pipelines` → `Pipeline[]`
- `POST /pipelines` with header `Idempotency-Key` → `201` `Pipeline`. Same key and same body must not create a second row.
- `GET /pipelines/{id}` → `Pipeline` or `404`
- `PATCH /pipelines/{id}` with `{ name?, product? }` → `Pipeline`
- `DELETE /pipelines/{id}` → `204`
- `GET /pipelines/{id}/runs?status=&limit=&cursor=` → `{ items: Run[], nextCursor: string | null }`, newest first
- `POST /pipelines/{id}/runs` with `{ triggeredBy, commitSha }` → `Run` whose status is `queued`
- `GET /runs/{id}` → run fields plus `notes`
- `PATCH /runs/{id}` with `{ status }` → the run, including `finishedAt` and `durationMs` when the status is terminal
- `POST /runs/{id}/notes` with `{ author, body }` → `Note`
- `DELETE /notes/{id}` → `204`
- `GET /runs/{id}/events` → `text/event-stream` messages of `{"status":"..."}`. Optional `finishedAt` and `durationMs`. The stream should end when the browser disconnects.

Validation errors use `400` and `{"error":{"code":"...","message":"..."}}`.

`product` is `flasharray`, `flashblade`, or `hyperscale`. `status` is `queued`, `running`, `passed`, `failed`, or `flaky`.

## Decisions

API calls live in `frontend/src/api`, page state in `frontend/src/state`, and views in `frontend/src/components` and `pages`. The runs list asks for 20 rows at a time and shows **Load more** only when `nextCursor` is set. Elapsed time for queued and running runs ticks once per second and the interval is cleared on navigation. The run page opens one `EventSource` and closes it on unmount. Pipeline create reuses one idempotency key until the same body succeeds and the list refresh completes.

## With more time

Wire this UI to the real API in Compose, replace the typed author with the signed-in user, and add a contract test that the seed file round-trips through the screens.
