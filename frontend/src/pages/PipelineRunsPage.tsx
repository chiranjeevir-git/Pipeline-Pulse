import { Link, useParams } from 'react-router-dom';
import { RUN_STATUSES, isRunStatus } from '../api/types';
import { CreateRunForm } from '../components/CreateRunForm';
import { ProductChip } from '../components/ProductChip';
import { RunRow } from '../components/RunRow';
import { EmptyState, ErrorState, LoadingState } from '../components/States';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import { isLiveStatus, statusLabel } from '../lib/status';
import { useNow } from '../state/useNow';
import { usePipelineRuns } from '../state/usePipelineRuns';

export function PipelineRunsPage() {
  const { id = '' } = useParams();
  const view = usePipelineRuns(id);
  const live = view.runs.some((run) => isLiveStatus(run.status));
  const now = useNow(live);
  useDocumentTitle(view.pipeline ? `${view.pipeline.name} · Pipeline Pulse` : 'Pipeline runs · Pipeline Pulse');

  return (
    <section className="page">
      <Link className="back-link" to="/">
        All pipelines
      </Link>
      <div className="page-head">
        {view.pipeline ? <ProductChip product={view.pipeline.product} /> : <p className="kicker">Pipeline</p>}
        <h1>{view.pipeline?.name ?? 'Pipeline runs'}</h1>
        {view.pipeline ? (
          <p className="meta mono" translate="no">
            {view.pipeline.id}
          </p>
        ) : (
          <p className="lede">Status, timing, and the commit that triggered each run.</p>
        )}
      </div>

      {view.actionError ? (
        <p className="alert" role="alert">
          {view.actionError}
        </p>
      ) : null}

      {view.phase === 'loading' ? (
        <div className="card">
          <LoadingState label="Loading runs" />
        </div>
      ) : null}
      {view.phase === 'error' && view.error ? (
        <div className="card">
          <ErrorState title="Couldn't load runs" message={view.error} onRetry={() => void view.reload()} />
        </div>
      ) : null}

      {view.phase === 'ready' ? (
        <>
          <section className="card">
            <h2>New run</h2>
            <CreateRunForm pending={view.pending} onCreate={view.create} onClearError={view.clearError} />
          </section>
          <section className="card">
            <div className="panel-head">
              <h2>Runs</h2>
              <div className="field compact">
                <label htmlFor="status-filter">Filter by status</label>
                <select
                  id="status-filter"
                  value={view.statusFilter}
                  onChange={(event) => {
                    const value = event.target.value;
                    view.updateFilter(value === '' || isRunStatus(value) ? value : '');
                  }}
                >
                  <option value="">All</option>
                  {RUN_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {statusLabel(status)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {view.runs.length === 0 ? (
              <EmptyState
                title={view.statusFilter ? 'No runs with this status.' : 'No runs yet.'}
                detail={view.statusFilter ? 'Choose another status or create a run.' : 'Create a run to see it here. New runs start queued.'}
              />
            ) : (
              <div className="run-table">
                <div className="run-head" aria-hidden="true">
                  <span>Status</span>
                  <span>Started</span>
                  <span>Duration</span>
                  <span>Triggered by</span>
                  <span>Commit</span>
                </div>
                <ul className="run-list">
                  {view.runs.map((run) => (
                    <RunRow key={run.id} run={run} now={now} />
                  ))}
                </ul>
                <p className="meta">Showing {view.runs.length} {view.runs.length === 1 ? 'run' : 'runs'}</p>
              </div>
            )}
            {view.nextCursor ? (
              <button
                type="button"
                className="button secondary load-more"
                data-testid="run-load-more"
                onClick={() => void view.loadMore()}
                disabled={view.loadingMore}
              >
                {view.loadingMore ? 'Loading…' : 'Load more'}
              </button>
            ) : null}
          </section>
        </>
      ) : null}
    </section>
  );
}
