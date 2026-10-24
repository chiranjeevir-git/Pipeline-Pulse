import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import type { Pipeline } from '../api/types';
import { formatTimestamp } from '../lib/format';
import { ProductChip } from './ProductChip';

interface PipelineRowProps {
  pipeline: Pipeline;
  pending: boolean;
  blocked: boolean;
  onRename: (id: string, name: string) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}

export function PipelineRow({ pipeline, pending, blocked, onRename, onDelete }: PipelineRowProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(pipeline.name);
  const [localError, setLocalError] = useState<string | null>(null);
  const inputId = `rename-${pipeline.id}`;

  function startEdit() {
    setDraft(pipeline.name);
    setLocalError(null);
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setLocalError(null);
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || blocked) return;
    const trimmed = draft.trim();
    if (!trimmed) {
      setLocalError('Enter a pipeline name.');
      return;
    }
    if (trimmed.length > 80) {
      setLocalError('Use 80 characters or fewer.');
      return;
    }
    if (trimmed === pipeline.name) {
      setEditing(false);
      return;
    }
    setLocalError(null);
    void onRename(pipeline.id, trimmed).then((ok) => {
      if (ok) setEditing(false);
    });
  }

  return (
    <li className="card pipeline-row" data-testid="pipeline-row">
      <div className="pipeline-main">
        {editing ? (
          <form className="rename-form" onSubmit={onSubmit} noValidate>
            <label className="sr-only" htmlFor={inputId}>
              Rename {pipeline.name}
            </label>
            <input
              id={inputId}
              value={draft}
              maxLength={80}
              autoComplete="off"
              spellCheck={false}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Escape') cancelEdit();
              }}
            />
            <button type="submit" className="button" disabled={pending || blocked}>
              {pending ? 'Saving…' : 'Save'}
            </button>
            <button type="button" className="button secondary" onClick={cancelEdit} disabled={pending || blocked}>
              Cancel
            </button>
          </form>
        ) : (
          <div className="pipeline-title">
            <Link className="pipeline-name" to={`/pipelines/${pipeline.id}`}>
              {pipeline.name}
            </Link>
            <ProductChip product={pipeline.product} />
          </div>
        )}
        {localError ? (
          <p className="field-error" role="alert">
            {localError}
          </p>
        ) : null}
        <p className="meta">
          <span className="mono" translate="no">
            {pipeline.id}
          </span>
          {pipeline.createdAt ? <span> · Created {formatTimestamp(pipeline.createdAt)}</span> : null}
        </p>
      </div>
      {editing ? null : (
        <div className="row-actions">
          <button type="button" className="button secondary" onClick={startEdit} disabled={pending || blocked}>
            Rename
          </button>
          <button type="button" className="button danger" onClick={() => void onDelete(pipeline.id)} disabled={pending || blocked}>
            {pending ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      )}
    </li>
  );
}
