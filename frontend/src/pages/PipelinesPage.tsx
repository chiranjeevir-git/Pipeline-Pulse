import { CreatePipelineForm } from '../components/CreatePipelineForm';
import { PipelineRow } from '../components/PipelineRow';
import { EmptyState, ErrorState, LoadingState } from '../components/States';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import { usePipelines } from '../state/usePipelines';

export function PipelinesPage() {
  const view = usePipelines();
  useDocumentTitle('Pipelines · Pipeline Pulse');

  return (
    <section className="page">
      <div className="page-head">
        <p className="kicker">Dashboard</p>
        <h1>Pipelines</h1>
        <p className="lede">Create a pipeline, rename it in place, or open it to inspect runs.</p>
      </div>

      {view.actionError ? (
        <p className="alert" role="alert">
          {view.actionError}
        </p>
      ) : null}

      <section className="card">
        <h2>New pipeline</h2>
        <CreatePipelineForm
          pending={view.pendingId === 'create'}
          disabled={view.pendingId !== null && view.pendingId !== 'create'}
          onCreate={view.create}
          onClearError={view.clearError}
        />
      </section>

      <section className="section">
        <h2>All pipelines</h2>
        {view.phase === 'loading' ? (
          <div className="card">
            <LoadingState label="Loading pipelines" />
          </div>
        ) : null}
        {view.phase === 'error' && view.error ? (
          <div className="card">
            <ErrorState title="Couldn't load pipelines" message={view.error} onRetry={() => void view.reload()} />
          </div>
        ) : null}
        {view.phase === 'ready' && view.pipelines.length === 0 ? (
          <div className="card">
            <EmptyState title="No pipelines yet." detail="Create one to start tracking runs." />
          </div>
        ) : null}
        {view.phase === 'ready' && view.pipelines.length > 0 ? (
          <ul className="stack">
            {view.pipelines.map((pipeline) => (
              <PipelineRow
                key={pipeline.id}
                pipeline={pipeline}
                pending={view.pendingId === pipeline.id}
                blocked={view.pendingId !== null && view.pendingId !== pipeline.id}
                onRename={view.rename}
                onDelete={view.remove}
              />
            ))}
          </ul>
        ) : null}
      </section>
    </section>
  );
}
