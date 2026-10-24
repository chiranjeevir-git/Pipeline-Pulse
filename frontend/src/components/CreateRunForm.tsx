import { useState, type FormEvent } from 'react';
import type { CreateRunInput } from '../api/types';
import { Field } from './Field';

const SHA_PATTERN = /^[0-9a-f]{7,64}$/i;

interface CreateRunFormProps {
  pending: boolean;
  onCreate: (input: CreateRunInput) => Promise<boolean>;
  onClearError: () => void;
}

export function CreateRunForm({ pending, onCreate, onClearError }: CreateRunFormProps) {
  const [triggeredBy, setTriggeredBy] = useState('');
  const [commitSha, setCommitSha] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onClearError();
    if (pending) return;
    const who = triggeredBy.trim();
    const sha = commitSha.trim().toLowerCase();
    if (!who) {
      setLocalError('Enter who triggered the run.');
      return;
    }
    if (who.length > 80) {
      setLocalError('Use 80 characters or fewer for who triggered the run.');
      return;
    }
    if (!SHA_PATTERN.test(sha)) {
      setLocalError('Enter a commit SHA of 7 to 64 hex characters.');
      return;
    }
    setLocalError(null);
    void onCreate({ triggeredBy: who, commitSha: sha }).then((ok) => {
      if (ok) setCommitSha('');
    });
  }

  return (
    <form className="stack-form" onSubmit={onSubmit} noValidate>
      <div className="form-grid form-grid-run">
        <Field id="run-triggered-by" label="Triggered by">
          <input
            id="run-triggered-by"
            name="triggeredBy"
            value={triggeredBy}
            maxLength={80}
            autoComplete="off"
            spellCheck={false}
            onChange={(event) => setTriggeredBy(event.target.value)}
          />
        </Field>
        <Field id="run-commit" label="Commit SHA">
          <input
            id="run-commit"
            name="commitSha"
            value={commitSha}
            maxLength={64}
            autoComplete="off"
            spellCheck={false}
            className="mono"
            placeholder="9f1c2a7d3b4e"
            onChange={(event) => setCommitSha(event.target.value)}
          />
        </Field>
        <button type="submit" className="button" disabled={pending}>
          {pending ? 'Creating…' : 'Create run'}
        </button>
      </div>
      {localError ? (
        <p className="field-error" role="alert">
          {localError}
        </p>
      ) : null}
    </form>
  );
}
