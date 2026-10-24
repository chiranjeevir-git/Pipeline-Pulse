-- Seed data for Pipeline Pulse (SQL).
-- Enum columns store ordinals:
--   product: flasharray=0, flashblade=1, hyperscale=2
--   status : queued=0, running=1, passed=2, failed=3, flaky=4
-- Re-runnable: ON CONFLICT (id) DO NOTHING keeps `make seed` idempotent.

BEGIN;

-- Pipelines (created_at is required by the schema; seeded with a fixed timestamp)
INSERT INTO pipelines (id, name, product, created_at) VALUES
    ('pl-flasharray-nightly', 'FlashArray Nightly', 0, TIMESTAMP '2026-10-01 00:00:00'),
    ('pl-flashblade-pr',      'FlashBlade PR Gate', 1, TIMESTAMP '2026-10-01 00:00:00'),
    ('pl-hyperscale-soak',    'Hyperscale Soak',    2, TIMESTAMP '2026-10-01 00:00:00')
ON CONFLICT (id) DO NOTHING;

-- Runs (finished_at / duration_ms are NULL for non-terminal runs)
INSERT INTO runs (id, pipeline_id, status, started_at, finished_at, duration_ms, triggered_by, commit_sha) VALUES
    ('run-0001', 'pl-flasharray-nightly', 2, TIMESTAMP '2026-10-10 01:00:00', TIMESTAMP '2026-10-10 02:12:00', 4320000,  'scheduler', '9f1c2a7d3b4e5f60718293a4b5c6d7e8f9a0b1c2'),
    ('run-0002', 'pl-flasharray-nightly', 3, TIMESTAMP '2026-10-11 01:00:00', TIMESTAMP '2026-10-11 01:48:00', 2880000,  'scheduler', 'a1b2c3d4e5f60718293a4b5c6d7e8f9a0b1c2d3e'),
    ('run-0003', 'pl-flasharray-nightly', 4, TIMESTAMP '2026-10-12 01:00:00', TIMESTAMP '2026-10-12 02:05:00', 3900000,  'scheduler', 'b2c3d4e5f60718293a4b5c6d7e8f9a0b1c2d3e4f'),
    ('run-0004', 'pl-flasharray-nightly', 1, TIMESTAMP '2026-10-14 01:00:00', NULL,                             NULL,     'scheduler', 'c3d4e5f60718293a4b5c6d7e8f9a0b1c2d3e4f5a'),
    ('run-0005', 'pl-flashblade-pr',      2, TIMESTAMP '2026-10-13 09:10:00', TIMESTAMP '2026-10-13 09:31:00', 1260000,  'priya.n',   'd4e5f60718293a4b5c6d7e8f9a0b1c2d3e4f5a6b'),
    ('run-0006', 'pl-flashblade-pr',      0, TIMESTAMP '2026-10-14 06:00:00', NULL,                             NULL,     'arun.k',    'e5f60718293a4b5c6d7e8f9a0b1c2d3e4f5a6b7c'),
    ('run-0007', 'pl-hyperscale-soak',    3, TIMESTAMP '2026-10-12 20:00:00', TIMESTAMP '2026-10-13 04:00:00', 28800000, 'scheduler', 'f60718293a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d')
ON CONFLICT (id) DO NOTHING;

-- Notes (created_at is required by the schema; seeded shortly after each run finished)
INSERT INTO notes (id, run_id, author, body, created_at) VALUES
    ('note-0001', 'run-0002', 'priya.n',   'iSCSI reconnect test timed out on node 3; same as last Tuesday.', TIMESTAMP '2026-10-11 02:00:00'),
    ('note-0002', 'run-0003', 'arun.k',    'Passed on retry. Suspect test ordering dependency.',              TIMESTAMP '2026-10-12 02:30:00'),
    ('note-0003', 'run-0007', 'scheduler', 'OOM in soak harness after 7h.',                                   TIMESTAMP '2026-10-13 05:00:00')
ON CONFLICT (id) DO NOTHING;

COMMIT;
