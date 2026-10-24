interface LoadingProps {
  label: string;
}

export function LoadingState({ label }: LoadingProps) {
  return (
    <div className="state state-loading" role="status" aria-live="polite" aria-busy="true">
      <p>{label}</p>
      <span className="skeleton" />
      <span className="skeleton short" />
      <span className="skeleton" />
    </div>
  );
}

interface EmptyProps {
  title: string;
  detail?: string;
}

export function EmptyState({ title, detail }: EmptyProps) {
  return (
    <div className="state state-empty">
      <p className="state-title">{title}</p>
      {detail ? <p>{detail}</p> : null}
    </div>
  );
}

interface ErrorProps {
  title: string;
  message: string;
  onRetry: () => void;
}

export function ErrorState({ title, message, onRetry }: ErrorProps) {
  return (
    <div className="state state-error" role="alert">
      <p className="state-title">{title}</p>
      <p>{message}</p>
      <button type="button" className="button secondary" onClick={onRetry}>
        Retry
      </button>
    </div>
  );
}
