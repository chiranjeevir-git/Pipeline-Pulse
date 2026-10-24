import type { RunStatus } from '../api/types';
import { STATUS_ACTIONS } from '../lib/status';

interface StatusActionsProps {
  current: RunStatus;
  pending: string | null;
  onChange: (status: RunStatus) => void;
}

export function StatusActions({ current, pending, onChange }: StatusActionsProps) {
  const busy = pending !== null;

  return (
    <div className="status-actions" role="group" aria-label="Change status">
      {STATUS_ACTIONS.map((action) => {
        const allowed = action.enabled(current);
        const saving = pending === action.status;
        return (
          <button
            key={action.status}
            type="button"
            className={action.status === 'failed' ? 'button danger' : action.status === 'running' ? 'button' : 'button secondary'}
            disabled={!allowed || busy}
            title={allowed ? undefined : action.hint}
            onClick={() => onChange(action.status)}
          >
            {saving ? 'Saving…' : action.label}
          </button>
        );
      })}
    </div>
  );
}
