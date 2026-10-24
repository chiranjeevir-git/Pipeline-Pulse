import { Link } from 'react-router-dom';
import type { Run } from '../api/types';
import { formatTimestamp, shortSha } from '../lib/format';
import { DurationValue } from './DurationValue';
import { StatusBadge } from './StatusBadge';

interface RunRowProps {
  run: Run;
  now: number;
}

export function RunRow({ run, now }: RunRowProps) {
  return (
    <li>
      <Link className="run-row" data-testid="run-row" to={`/runs/${run.id}`}>
        <span className="cell">
          <span className="cell-label">Status</span>
          <StatusBadge status={run.status} />
        </span>
        <span className="cell">
          <span className="cell-label">Started</span>
          <time className="tabular" dateTime={run.startedAt}>
            {formatTimestamp(run.startedAt)}
          </time>
          <span className="meta mono" translate="no">
            {run.id}
          </span>
        </span>
        <span className="cell">
          <span className="cell-label">Duration</span>
          <DurationValue run={run} now={now} />
        </span>
        <span className="cell">
          <span className="cell-label">Triggered by</span>
          <span>{run.triggeredBy}</span>
        </span>
        <span className="cell">
          <span className="cell-label">Commit</span>
          <code className="mono" translate="no" title={run.commitSha}>
            {shortSha(run.commitSha)}
          </code>
        </span>
      </Link>
    </li>
  );
}
