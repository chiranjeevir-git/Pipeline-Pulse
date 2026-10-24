import type { Run } from '../api/types';
import { elapsedBetween, elapsedMs, formatDuration } from '../lib/format';
import { isLiveStatus } from '../lib/status';

interface DurationValueProps {
  run: Run;
  now: number;
}

export function DurationValue({ run, now }: DurationValueProps) {
  if (run.durationMs != null) return <span className="tabular">{formatDuration(run.durationMs)}</span>;
  if (run.finishedAt) {
    const span = elapsedBetween(run.startedAt, run.finishedAt);
    return <span className="tabular">{span == null ? '—' : formatDuration(span)}</span>;
  }
  if (isLiveStatus(run.status)) {
    return <span className="tabular">{formatDuration(elapsedMs(run.startedAt, now))}</span>;
  }
  return <span>—</span>;
}
