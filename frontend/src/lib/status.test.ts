import { describe, expect, it } from 'vitest';
import { makeRunDetail } from '../test/fixtures';
import { STATUS_ACTIONS, applyStatusEvent, parseStatusEvent } from './status';

describe('STATUS_ACTIONS', () => {
  it('starts only a queued run and hides the action for the current status', () => {
    const start = STATUS_ACTIONS.find((action) => action.label === 'Start');
    const pass = STATUS_ACTIONS.find((action) => action.label === 'Pass');
    expect(start?.enabled('queued')).toBe(true);
    expect(start?.enabled('running')).toBe(false);
    expect(start?.enabled('failed')).toBe(false);
    expect(pass?.enabled('queued')).toBe(true);
    expect(pass?.enabled('passed')).toBe(false);
  });
});

describe('parseStatusEvent', () => {
  it('reads a status payload and ignores anything else', () => {
    expect(parseStatusEvent('{"status":"running"}')).toEqual({
      status: 'running',
      finishedAt: undefined,
      durationMs: undefined,
    });
    expect(parseStatusEvent('{"status":"nope"}')).toBeNull();
    expect(parseStatusEvent('not json')).toBeNull();
  });
});

describe('applyStatusEvent', () => {
  it('replaces status and clears timing when the event sends nulls', () => {
    const next = applyStatusEvent(makeRunDetail(), {
      status: 'running',
      finishedAt: null,
      durationMs: null,
    });
    expect(next.status).toBe('running');
    expect(next.finishedAt).toBeUndefined();
    expect(next.durationMs).toBeUndefined();
    expect(next.notes).toHaveLength(1);
  });

  it('keeps timing when the event only carries a status', () => {
    const next = applyStatusEvent(makeRunDetail(), { status: 'flaky' });
    expect(next.status).toBe('flaky');
    expect(next.durationMs).toBe(2_880_000);
  });
});
