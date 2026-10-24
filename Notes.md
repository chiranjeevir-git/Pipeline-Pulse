# Notes

Frontend slice on the `frontend` branch. The API, database, migrations, and seed loader are not in this branch's work.

## Gaps

- The supplied seed has at most four runs on a pipeline. With a page size of 20, **Load more** stays hidden until the API returns `nextCursor`.
- The runs table does not subscribe to status events. Live updates are on the run page only.
- Note author is whatever is typed into the form. The last author is kept in `sessionStorage`.
- Creating a run refreshes the rows already on screen by inserting the new run. It does not reload later pages.
- Pass, Fail, and Mark flaky are available from any other status. Start is available only from queued.

## Assumptions

- `GET /pipelines` is a bare JSON array.
- Run pages use `{ items, nextCursor }`.
- `GET /runs/{id}` includes `notes`. A missing `notes` array is treated as none.
- A terminal status event without timing triggers one follow-up `GET` so duration can fill in. That request is aborted if the user leaves the page.
