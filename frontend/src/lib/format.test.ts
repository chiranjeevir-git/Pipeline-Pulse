import { describe, expect, it } from 'vitest';
import { elapsedBetween, formatDuration, formatTimestamp, shortSha } from './format';

describe('formatDuration', () => {
  it('renders seconds, minutes, and hours', () => {
    expect(formatDuration(0)).toBe('0s');
    expect(formatDuration(1000)).toBe('1s');
    expect(formatDuration(61_000)).toBe('1m 1s');
    expect(formatDuration(4_320_000)).toBe('1h 12m');
    expect(formatDuration(28_800_000)).toBe('8h 0m');
  });

  it('rejects values that are not a duration', () => {
    expect(formatDuration(-1)).toBe('—');
    expect(formatDuration(Number.NaN)).toBe('—');
  });
});

describe('formatTimestamp', () => {
  it('includes the year for a valid instant', () => {
    expect(formatTimestamp('2026-10-11T01:00:00Z')).toContain('2026');
  });

  it('returns the original text when it is not a date', () => {
    expect(formatTimestamp('not-a-date')).toBe('not-a-date');
  });
});

describe('shortSha', () => {
  it('keeps short values and trims long ones', () => {
    expect(shortSha('abc1234')).toBe('abc1234');
    expect(shortSha('a1b2c3d4e5f60718293a4b5c6d7e8f9a0b1c2d3e')).toBe('a1b2c3d4e5f6');
  });
});

describe('elapsedBetween', () => {
  it('returns null when the finish is before the start', () => {
    expect(elapsedBetween('2026-10-11T02:00:00Z', '2026-10-11T01:00:00Z')).toBeNull();
  });
});
