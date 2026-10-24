import type { RunStatus } from '../api/types';
import { statusLabel } from '../lib/status';

interface StatusBadgeProps {
  status: RunStatus;
  live?: boolean;
}

export function StatusBadge({ status, live = false }: StatusBadgeProps) {
  return (
    <span
      className={`badge badge-${status}`}
      data-testid="run-status-badge"
      data-status={status}
      role={live ? 'status' : undefined}
      aria-live={live ? 'polite' : undefined}
    >
      <span className="badge-dot" aria-hidden="true" />
      {statusLabel(status)}
    </span>
  );
}
