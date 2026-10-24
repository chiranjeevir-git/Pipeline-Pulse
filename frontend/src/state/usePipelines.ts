import { useCallback, useEffect, useRef, useState } from 'react';
import { errorMessage, isAbortError } from '../api/http';
import { createPipeline, deletePipeline, listPipelines, updatePipeline } from '../api/pipelines';
import type { CreatePipelineInput, Pipeline } from '../api/types';
import { reuseIdempotencyKey, type IdempotencyAttempt } from '../lib/idempotency';

type Phase = 'loading' | 'ready' | 'error';

interface LoadOptions {
  background?: boolean;
}

export function usePipelines() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [phase, setPhase] = useState<Phase>('loading');
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const loadRef = useRef<AbortController | null>(null);
  const actionRef = useRef<AbortController | null>(null);
  const epoch = useRef(0);
  const busyRef = useRef(false);
  const idempotency = useRef<IdempotencyAttempt | null>(null);

  const load = useCallback(async (options?: LoadOptions): Promise<boolean> => {
    loadRef.current?.abort();
    const ctrl = new AbortController();
    loadRef.current = ctrl;
    const epochAtStart = epoch.current;
    if (!options?.background) {
      setError(null);
      setPhase((current) => (current === 'ready' ? 'ready' : 'loading'));
    }

    try {
      const rows = await listPipelines(ctrl.signal);
      if (ctrl.signal.aborted || epoch.current !== epochAtStart || loadRef.current !== ctrl) return false;
      setPipelines(rows);
      setPhase('ready');
      setError(null);
      return true;
    } catch (err) {
      if (ctrl.signal.aborted || isAbortError(err) || epoch.current !== epochAtStart) return false;
      if (options?.background) {
        setActionError(errorMessage(err));
        return false;
      }
      setError(errorMessage(err));
      setPhase('error');
      return false;
    }
  }, []);

  useEffect(() => {
    const action = new AbortController();
    actionRef.current = action;
    void load();
    return () => {
      action.abort();
      loadRef.current?.abort();
    };
  }, [load]);

  async function create(input: CreatePipelineInput): Promise<boolean> {
    const ctrl = actionRef.current;
    if (!ctrl || ctrl.signal.aborted || busyRef.current) return false;
    busyRef.current = true;
    setPendingId('create');
    setActionError(null);
    const body = JSON.stringify(input);
    idempotency.current = reuseIdempotencyKey(idempotency.current, body);
    const key = idempotency.current.key;

    try {
      const created = await createPipeline(input, key, ctrl.signal);
      if (ctrl.signal.aborted) return false;
      epoch.current += 1;
      setPipelines((prev) => [created, ...prev.filter((pipeline) => pipeline.id !== created.id)]);
      setPhase('ready');
      setError(null);
      const refreshed = await load({ background: true });
      if (refreshed && !ctrl.signal.aborted) idempotency.current = null;
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

  async function rename(id: string, name: string): Promise<boolean> {
    const ctrl = actionRef.current;
    if (!ctrl || ctrl.signal.aborted || busyRef.current) return false;
    busyRef.current = true;
    setPendingId(id);
    setActionError(null);

    try {
      const updated = await updatePipeline(id, { name }, ctrl.signal);
      if (ctrl.signal.aborted) return false;
      epoch.current += 1;
      setPipelines((prev) => prev.map((pipeline) => (pipeline.id === id ? updated : pipeline)));
      void load({ background: true });
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

  async function remove(id: string): Promise<boolean> {
    const ctrl = actionRef.current;
    if (!ctrl || ctrl.signal.aborted || busyRef.current) return false;
    busyRef.current = true;
    setPendingId(id);
    setActionError(null);

    try {
      await deletePipeline(id, ctrl.signal);
      if (ctrl.signal.aborted) return false;
      epoch.current += 1;
      setPipelines((prev) => prev.filter((pipeline) => pipeline.id !== id));
      void load({ background: true });
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
    pipelines,
    phase,
    error,
    actionError,
    pendingId,
    clearError: () => setActionError(null),
    reload: () => load(),
    create,
    rename,
    remove,
  };
}
