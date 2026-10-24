import type { Note } from '../api/types';
import { formatTimestamp } from '../lib/format';

interface NoteRowProps {
  note: Note;
  pending: boolean;
  blocked?: boolean;
  onDelete: (id: string) => void;
}

export function NoteRow({ note, pending, blocked = false, onDelete }: NoteRowProps) {
  return (
    <li className="note-row" data-testid="note-row">
      <div className="note-head">
        <p className="note-author">{note.author}</p>
        {note.createdAt ? (
          <time className="meta" dateTime={note.createdAt}>
            {formatTimestamp(note.createdAt)}
          </time>
        ) : null}
      </div>
      <p className="note-body">{note.body}</p>
      <button type="button" className="button danger" onClick={() => onDelete(note.id)} disabled={pending || blocked}>
        {pending ? 'Deleting…' : 'Delete note'}
      </button>
    </li>
  );
}
