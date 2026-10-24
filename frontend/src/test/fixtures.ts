import type { Note, Pipeline, Run, RunDetail } from '../api/types';

export const pipeline: Pipeline = {
  id: 'pl-flasharray-nightly',
  name: 'FlashArray Nightly',
  product: 'flasharray',
  createdAt: '2026-10-01T00:00:00Z',
};

export function makeRun(overrides: Partial<Run> = {}): Run {
  return {
    id: 'run-0002',
    pipelineId: pipeline.id,
    status: 'failed',
    startedAt: '2026-10-11T01:00:00Z',
    finishedAt: '2026-10-11T01:48:00Z',
    durationMs: 2_880_000,
    triggeredBy: 'scheduler',
    commitSha: 'a1b2c3d4e5f60718293a4b5c6d7e8f9a0b1c2d3e',
    ...overrides,
  };
}

export function makeNote(overrides: Partial<Note> = {}): Note {
  return {
    id: 'note-0001',
    runId: 'run-0002',
    author: 'priya.n',
    body: 'iSCSI reconnect test timed out on node 3.',
    createdAt: '2026-10-11T02:00:00Z',
    ...overrides,
  };
}

export function makeRunDetail(overrides: Partial<RunDetail> = {}): RunDetail {
  return { ...makeRun(), notes: [makeNote()], ...overrides };
}
