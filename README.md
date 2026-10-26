# Pipeline Pulse

A pipeline run dashboard: what ran, what failed, and why. React UI, a Spring Boot (Java 21) API, and PostgreSQL, wired together with Docker Compose.

## Run the whole stack (Docker Compose)

The fastest way to run everything — it builds and packages the frontend, builds the Java backend, and starts Postgres:

```bash
docker compose up --build
```

| Service    | What it is                                  | URL / port                |
| ---------- | ------------------------------------------- | ------------------------- |
| `frontend` | React build served by nginx                 | <http://localhost:3000>   |
| `java-app` | Spring Boot API                             | <http://localhost:8080>   |
| `postgres` | PostgreSQL 14                               | `localhost:5433` → `5432` |

The frontend container proxies `/api/` to `java-app:8080` over the internal network, so the UI and the live SSE stream stay same-origin. On first start the API runs Liquibase to create the schema. Stop with `Ctrl+C`; `docker compose down -v` also drops the database volume.

Seed the Compose database once the API is up (note the Compose port/credentials differ from the local defaults):

```bash
make seed PGPORT=5433 PGUSER=postgres PGPASSWORD=postgres
```

## Run the UI on its own

For frontend-only development without the containers:

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

## Seed the database

Sample data lives in `seed/seed.json` (SQL inserts). The schema is created by Liquibase when the API starts, so boot the API once before seeding, then:

```bash
make seed
```

This loads 3 pipelines, 7 runs, and 3 notes. It is idempotent (`ON CONFLICT (id) DO NOTHING`), so re-running it is safe. The command shells out to `psql -f seed/seed.json`.

Connection settings default to `localhost:5432` with db/user/password `pulse` (matching `application.yaml` for a locally run API) and can be overridden on the command line:

```bash
# local API defaults
make seed

# Docker Compose Postgres (published on 5433, user/pass postgres)
make seed PGPORT=5433 PGUSER=postgres PGPASSWORD=postgres

# any other target
make seed PGHOST=db PGPORT=5432 PGUSER=pulse PGPASSWORD=secret
```

Run `make help` to list targets.

## Files in this repo

| Path                                              | Purpose                                                              |
| ------------------------------------------------- | ------------------------------------------------------------------- |
| `frontend/`                                       | React 19 + TypeScript UI (Vite dev server, Vitest tests)            |
| `frontend/Dockerfile`                             | Multi-stage build: Node builds the UI, nginx serves it on port 3000 |
| `frontend/nginx.conf.template`                    | nginx config; proxies `/api/` to `API_UPSTREAM`                     |
| `src/`                                            | Spring Boot (Java 21) API — controllers, services, JPA entities     |
| `src/main/resources/application.yaml`             | API config (datasource, JPA, Liquibase)                             |
| `src/main/resources/db/changelog/...master.sql`  | Liquibase formatted-SQL schema, applied on API startup              |
| `Dockerfile`                                      | Builds the Java backend image                                       |
| `docker-compose.yaml`                             | Orchestrates `frontend` + `java-app` + `postgres`                   |
| `Makefile`                                        | Developer tasks; `make seed` loads the seed data                    |
| `seed/seed.json`                                  | Sample data as SQL inserts (despite the `.json` name)               |

## Decisions

API calls live in `frontend/src/api`, page state in `frontend/src/state`, and views in `frontend/src/components` and `pages`. The runs list asks for 20 rows at a time and shows **Load more** only when `nextCursor` is set. Elapsed time for queued and running runs ticks once per second and the interval is cleared on navigation. The run page opens one `EventSource` and closes it on unmount. Pipeline create reuses one idempotency key until the same body succeeds and the list refresh completes.
