import { useState, type FormEvent } from 'react';
import type { CreateNoteInput } from '../api/types';
import { Field } from './Field';

const AUTHOR_KEY = 'pipeline-pulse.author';

function readAuthor(): string {
  try {
    return sessionStorage.getItem(AUTHOR_KEY) ?? '';
  } catch {
    return '';
  }
}

function writeAuthor(author: string): void {
  try {
    sessionStorage.setItem(AUTHOR_KEY, author);
  } catch {
    // Ignore storage failures in private browsing.
  }
}

interface NoteFormProps {
  pending: boolean;
  disabled?: boolean;
  onAdd: (input: CreateNoteInput) => Promise<boolean>;
  onClearError: () => void;
}

export function NoteForm({ pending, disabled = false, onAdd, onClearError }: NoteFormProps) {
  const [author, setAuthor] = useState(readAuthor);
  const [body, setBody] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onClearError();
    if (pending || disabled) return;
    const trimmedAuthor = author.trim();
    const trimmedBody = body.trim();
    if (!trimmedAuthor) {
      setLocalError('Enter your name.');
      return;
    }
    if (trimmedAuthor.length > 80) {
      setLocalError('Use 80 characters or fewer for the author.');
      return;
    }
    if (!trimmedBody) {
      setLocalError('Enter a note.');
      return;
    }
    if (trimmedBody.length > 2000) {
      setLocalError('Use 2000 characters or fewer.');
      return;
    }
    setLocalError(null);
    void onAdd({ author: trimmedAuthor, body: trimmedBody }).then((ok) => {
      if (!ok) return;
      setBody('');
      writeAuthor(trimmedAuthor);
    });
  }

  return (
    <form className="stack-form" onSubmit={onSubmit} noValidate>
      <Field id="note-author" label="Author">
        <input
          id="note-author"
          name="author"
          value={author}
          maxLength={80}
          autoComplete="nickname"
          spellCheck={false}
          onChange={(event) => setAuthor(event.target.value)}
        />
      </Field>
      <Field id="note-body" label="Note">
        <textarea
          id="note-body"
          name="body"
          value={body}
          maxLength={2000}
          onChange={(event) => setBody(event.target.value)}
        />
      </Field>
      <button type="submit" className="button" data-testid="note-add" disabled={pending || disabled}>
        {pending ? 'Adding…' : 'Add note'}
      </button>
      {localError ? (
        <p className="field-error" role="alert">
          {localError}
        </p>
      ) : null}
    </form>
  );
}
