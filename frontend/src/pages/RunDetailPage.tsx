import { Link, useParams } from 'react-router-dom';
import { DurationValue } from '../components/DurationValue';
import { NoteForm } from '../components/NoteForm';
import { NoteRow } from '../components/NoteRow';
import { StatusActions } from '../components/StatusActions';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState, ErrorState, LoadingState } from '../components/States';
import { formatTimestamp } from '../lib/format';
import { isLiveStatus } from '../lib/status';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import { useNow } from '../state/useNow';
import { useRunDetail } from '../state/useRunDetail';

const LIVE_LABEL = {
  connecting: 'Connecting',
  open: 'Live',
  reconnecting: 'Reconnecting',
} as const;

export function RunDetailPage() {
  const { id = '' } = useParams();
  const view = useRunDetail(id);
  const now = useNow(view.run ? isLiveStatus(view.run.status) : false);
  useDocumentTitle(view.run ? `${view.run.id} · Pipeline Pulse` : 'Run · Pipeline Pulse');

  if (view.phase === 'loading') {
    return (
      <section className="page">
        <h1>Run</h1>
        <div className="card">
          <LoadingState label="Loading run" />
        </div>
      </section>
    );
  }

  if (view.phase === 'error' || !view.run) {
    return (
      <section className="page">
        <h1>Run</h1>
        <div className="card">
          <ErrorState
            title="Couldn't load this run"
            message={view.error ?? 'This run is unavailable.'}
            onRetry={() => void view.reload()}
          />
        </div>
      </section>
    );
  }

  const run = view.run;

  return (
    <section className="page">
      <Link className="back-link" to={`/pipelines/${run.pipelineId}`}>
        Pipeline runs
      </Link>
      <div className="page-head">
        <p className="kicker">Run</p>
        <div className="title-row">
          <h1 className="mono" translate="no">
            {run.id}
          </h1>
          <StatusBadge status={run.status} live />
          <span className={`live-pill live-${view.live}`}>{LIVE_LABEL[view.live]}</span>
        </div>
      </div>

      {view.actionError ? (
        <p className="alert" role="alert">
          {view.actionError}
        </p>
      ) : null}

      <section className="card">
        <h2>Timing</h2>
        <dl className="facts">
          <div>
            <dt>Started</dt>
            <dd>
              <time className="tabular" dateTime={run.startedAt}>
                {formatTimestamp(run.startedAt)}
              </time>
            </dd>
          </div>
          <div>
            <dt>Finished</dt>
            <dd>
              {run.finishedAt ? (
                <time className="tabular" dateTime={run.finishedAt}>
                  {formatTimestamp(run.finishedAt)}
                </time>
              ) : (
                '—'
              )}
            </dd>
          </div>
          <div>
            <dt>Duration</dt>
            <dd>
              <DurationValue run={run} now={now} />
            </dd>
          </div>
          <div>
            <dt>Triggered by</dt>
            <dd>{run.triggeredBy}</dd>
          </div>
          <div>
            <dt>Commit</dt>
            <dd>
              <code className="mono" translate="no">
                {run.commitSha}
              </code>
            </dd>
          </div>
        </dl>
      </section>

      <section className="card">
        <h2>Change status</h2>
        <p className="lede">Start moves a queued run to running. Pass, fail, and mark flaky record the outcome.</p>
        <StatusActions current={run.status} pending={view.pending} onChange={(status) => void view.changeStatus(status)} />
      </section>

      <section className="card">
        <h2>Triage notes</h2>
        <NoteForm
          pending={view.pending === 'note'}
          disabled={view.pending !== null && view.pending !== 'note'}
          onAdd={view.addNote}
          onClearError={view.clearError}
        />
        {run.notes.length === 0 ? (
          <EmptyState title="No triage notes yet." detail="Add what failed, what you retried, and what to watch next time." />
        ) : (
          <ul className="note-list">
            {run.notes.map((note) => (
              <NoteRow
                key={note.id}
                note={note}
                pending={view.pending === note.id}
                blocked={view.pending !== null && view.pending !== note.id}
                onDelete={(noteId) => void view.removeNote(noteId)}
              />
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}
