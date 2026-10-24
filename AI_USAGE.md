# AI usage

## Tools used

Cursor — Grok 4.7 for the frontend slice, Claude Opus for the backend slice.

## Where

- **Frontend (`frontend/`)** — AI-generated from the brief: API client, page state hooks, views, styles, tests, and the container files.
- **Backend (`src/`, `pom.xml`, Liquibase changelog)** — AI-generated, then revised repeatedly against explicit direction (see "What changed"): JPA entities and converters, repositories, services, controllers, the SSE broker, idempotency handling, and the SQL migration.
- **Hand-driven decisions** — branch layout (`main`/`backend`/`frontend`), the persistence contract (ordinal enums, Postgres-generated text ids), the migration format, and the query style were all specified or corrected by me rather than taken as first drafts.
- `README.md` and `Notes.md` were rewritten for these slices.

## Prompts

These are representative of where I scoped the work or revisited an AI decision with reasoning (close to verbatim):

1. "I would need you to implement **ONLY** the front end part of it completely as instructed & described in the document for now … follow the requirement & instructions as provided in the document."
2. "Keep main branch clean (keep the things I added for backend) and remove any front end related things still existing in main branch … create a separate branch for backend and commit backend changes over there & keep main branch to its remote replica only."
3. "I don't want liquibase to be a yaml, instead it should be a sql file with changeset based change & should be able to execute along with application run … and since the sql file is not committed yet, do not keep an incremental change — just update the main table definition itself."
4. "Instead of keeping product names as is in string format, use enums & only store the enum ordinal values instead of string in db (in java it could be small int) … in jpa entities simply use attribute converter implementations to map it to db column vs java object & vice versa."
5. "I'm fine dropping h2, please make sure missing ids (null during create) will be handled by postgres uuid creation but stores it in text format only."

Other steering prompts in the same spirit: "when the application re-runs it should not cause schema migration issues, so add IF NOT EXISTS"; "do not use FQ class names, use imports"; "do not use Clock, use Instant"; "you don't need a whole Ids class, keep it a simple method in a common util"; "in RunRepository use native query only and remove the null checks for status & cursor".

## What changed

Concrete places where I rejected or rewrote the AI's first output, and why:

1. **Migration format: YAML → formatted SQL.** The AI first shipped a Liquibase YAML changelog. I required a single formatted-SQL changelog with `--changeset` blocks that runs on application startup, because I wanted the exact SQL to be reviewable and executable as-is. It was rewritten to `db.changelog-master.sql`.
2. **No incremental migration for un-committed schema.** The AI added the Postgres id defaults as a separate `ALTER TABLE` changeset (005). Since nothing was committed yet, I rejected the incremental step and had the `DEFAULT (gen_random_uuid())::text` folded directly into each `CREATE TABLE`, so the baseline schema is one clean definition rather than create-then-alter.
3. **Enum persistence: string → ordinal smallint via converters.** The AI stored `product`/`status` as strings. I changed this to store the enum **ordinal** in a `SMALLINT` column through `AttributeConverter`s, while JSON in/out stays the string form. When Hibernate's schema validation rejected `Integer` against `SMALLINT`, the converters were narrowed to `Short`; and when the converters were only auto-applied, I had them wired explicitly with `@Convert` on the entity fields.
4. **Identifier strategy: app-side UUID → client-or-Postgres text id.** The AI generated ids in the application (a dedicated `Ids` UUID helper). I rejected that: ids are plain varchar (not necessarily UUIDs), a client-supplied id must be honored, and otherwise Postgres must create it. This became a custom Hibernate `BeforeExecutionGenerator` that keeps a supplied id or runs `select gen_random_uuid()::text`, backed by a column `DEFAULT` for direct inserts.
5. **Repository queries: optional-filter JPQL → native queries, no null checks.** The AI used a single JPQL query with `:status is null or …` / `:cursor is null or …` branches plus a `Pageable`. I required native queries only and removal of those null checks; it was split into two native queries selected by whether a status filter is present, with an upper-bound sentinel cursor for the first page.
6. **Test database: H2 → real Postgres.** The AI validated against H2 in Postgres mode. Because the id generation and `gen_random_uuid()` default are Postgres features, I dropped H2 and moved the context test to a Postgres Testcontainer. This also surfaced `CLOB` not existing on Postgres, so `response_body` was rewritten to `TEXT` and `@Lob` removed to avoid a large-object/OID mapping.
7. **Code style corrections.** I rejected fully-qualified class references in favor of imports, replaced the injected `Clock` with `Instant.now()`, and collapsed the standalone `Ids` class into a small `Util` method.
8. **Branch and repo hygiene.** The AI's work initially sat together in the working tree. I had it split so backend lives on `backend`, frontend on `frontend`, and `main` stays identical to its remote; and when `.idea/` was tracked by mistake I had it untracked and added to `.gitignore` on both branches.

Frontend-specific rewrites: the delete control was kept as a single inline button (no confirmation dialog the brief never asks for); `GET /pipelines` is parsed as a bare JSON array while only runs use `{ items, nextCursor }`; and a pipeline-create no longer lets an in-flight list response overwrite the newly created row.

## Verification

- **Backend** — `mvn -s settings.xml test` builds and runs the context test against a Postgres Testcontainer; all four Liquibase changesets apply on Postgres 14 and Hibernate `ddl-auto: validate` confirms the entities match the migrated schema (this is how the enum/ordinal, text-id, and `TEXT` column fixes were caught).
- **Frontend** — `npm test` and `npm run typecheck` in `frontend/` cover formatting, the idempotency key, error envelopes, request cancellation, the status stream closing on unmount, load more, filters, and note add. The UI was exercised in a browser against a temporary local API at 375px and 1440px.

## Assistant Attestation

Models: Grok 4.7 (frontend) and Claude Opus (backend). Date: 2026-10-24.

Files generated or substantially edited:

- `frontend/` (application, tests, Dockerfile, nginx template)
- `src/main/java/com/pipeline/pulse/` (domain, repository, service, web, controllers, common)
- `src/main/resources/application.yaml`, `src/main/resources/db/changelog/db.changelog-master.sql`
- `src/test/java/com/pipeline/pulse/PulseApplicationTests.java`
- `pom.xml`
- `.gitignore`
- `README.md`
- `Notes.md`
- `AI_USAGE.md`
