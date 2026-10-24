import { useCallback, useEffect, useRef, useState } from 'react';
import { errorMessage, isAbortError } from '../api/http';
import { getPipeline } from '../api/pipelines';
import { RUN_PAGE_SIZE, createRun, listRuns } from '../api/runs';
import type { CreateRunInput, Pipeline, Run, RunStatus } from '../api/types';

type Phase = 'loading' | 'ready' | 'error';

export function usePipelineRuns(pipelineId: string) {
  const [boundId, setBoundId] = useState(pipelineId);
  const [pipeline, setPipeline] = useState<Pipeline | null>(null);
  const [runs, setRuns] = useState<Run[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<RunStatus | ''>('');
  const [phase, setPhase] = useState<Phase>('loading');
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const loadRef = useRef<AbortController | null>(null);
  const moreRef = useRef<AbortController | null>(null);
  const actionRef = useRef<AbortController | null>(null);
  const busyRef = useRef(false);
  const filterRef = useRef<RunStatus | ''>('');

  if (boundId !== pipelineId) {
    setBoundId(pipelineId);
    setPipeline(null);
    setRuns([]);
    setNextCursor(null);
    setStatusFilter('');
    setPhase('loading');
    setError(null);
    setActionError(null);
    setLoadingMore(false);
    setPendingId(null);
    filterRef.current = '';
  }

  filterRef.current = statusFilter;

  const load = useCallback(async (filter: RunStatus | '') => {
    loadRef.current?.abort();
    moreRef.current?.abort();
    const ctrl = new AbortController();
    loadRef.current = ctrl;
    setLoadingMore(false);
    setPhase('loading');
    setRuns([]);
    setNextCursor(null);
    setError(null);

    try {
      const pipelinePromise = getPipeline(pipelineId, ctrl.signal);
      const runsPromise = listRuns(pipelineId, {
        status: filter || undefined,
        limit: RUN_PAGE_SIZE,
        signal: ctrl.signal,
      });
      const [pipelineResult, runsResult] = await Promise.allSettled([pipelinePromise, runsPromise]);
      if (ctrl.signal.aborted || loadRef.current !== ctrl) return;
      if (pipelineResult.status === 'rejected') throw pipelineResult.reason;
      if (runsResult.status === 'rejected') throw runsResult.reason;
      setPipeline(pipelineResult.value);
      setRuns(runsResult.value.items);
      setNextCursor(runsResult.value.nextCursor);
      setPhase('ready');
    } catch (err) {
      if (ctrl.signal.aborted || isAbortError(err) || loadRef.current !== ctrl) return;
      setError(errorMessage(err));
      setPhase('error');
    }
  }, [pipelineId]);

  useEffect(() => {
    const action = new AbortController();
    actionRef.current = action;
    return () => action.abort();
  }, [pipelineId]);

  useEffect(() => {
    void load(statusFilter);
    return () => {
      loadRef.current?.abort();
      moreRef.current?.abort();
    };
  }, [load, statusFilter]);

  function updateFilter(next: RunStatus | '') {
    setActionError(null);
    setStatusFilter(next);
  }

  async function loadMore() {
    const cursor = nextCursor;
    if (!cursor || loadingMore || busyRef.current) return;
    moreRef.current?.abort();
    const ctrl = new AbortController();
    moreRef.current = ctrl;
    setLoadingMore(true);
    setActionError(null);

    try {
      const page = await listRuns(pipelineId, {
        status: filterRef.current || undefined,
        limit: RUN_PAGE_SIZE,
        cursor,
        signal: ctrl.signal,
      });
      if (ctrl.signal.aborted || moreRef.current !== ctrl) return;
      setRuns((prev) => {
        const seen = new Set(prev.map((run) => run.id));
        return [...prev, ...page.items.filter((run) => !seen.has(run.id))];
      });
      setNextCursor(page.nextCursor);
    } catch (err) {
      if (ctrl.signal.aborted || isAbortError(err)) return;
      setActionError(errorMessage(err));
    } finally {
      if (!ctrl.signal.aborted && moreRef.current === ctrl) setLoadingMore(false);
    }
  }

  async function create(input: CreateRunInput): Promise<boolean> {
    const ctrl = actionRef.current;
    if (!ctrl || ctrl.signal.aborted || busyRef.current) return false;
    busyRef.current = true;
    setPendingId('create');
    setActionError(null);

    try {
      const created = await createRun(pipelineId, input, ctrl.signal);
      if (ctrl.signal.aborted) return false;
      const filter = filterRef.current;
      if (!filter || filter === created.status) {
        setRuns((prev) => [created, ...prev.filter((run) => run.id !== created.id)]);
      }
      setPhase('ready');
      return true;
    } catch (err) {
      if (ctrl.signal.aborted || isAbortError(err)) return false;
      setActionError(errorMessage(err));
      return false;
    } finally {
      busyRef.current = false;
      if (!ctrl.signal.aborted) setPendingId(null);
    }
  }

  return {
    pipeline,
    runs,
    nextCursor,
    statusFilter,
    updateFilter,
    phase,
    error,
    actionError,
    clearError: () => setActionError(null),
    loadingMore,
    pending: pendingId !== null,
    reload: () => load(filterRef.current),
    loadMore,
    create,
  };
}
