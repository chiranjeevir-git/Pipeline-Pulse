import { useCallback, useEffect, useRef, useState } from 'react';
import { errorMessage, isAbortError } from '../api/http';
import { createNote, deleteNote } from '../api/notes';
import { getRun, patchRun, runEventsUrl } from '../api/runs';
import type { CreateNoteInput, RunDetail, RunStatus, RunStatusEvent } from '../api/types';
import { applyStatusEvent, isTerminal, parseStatusEvent } from '../lib/status';

type Phase = 'loading' | 'ready' | 'error';
export type LiveState = 'connecting' | 'open' | 'reconnecting';

export function useRunDetail(runId: string) {
  const [boundId, setBoundId] = useState(runId);
  const [run, setRun] = useState<RunDetail | null>(null);
  const [phase, setPhase] = useState<Phase>('loading');
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [live, setLive] = useState<LiveState>('connecting');

  const loadRef = useRef<AbortController | null>(null);
  const actionRef = useRef<AbortController | null>(null);
  const refreshRef = useRef<AbortController | null>(null);
  const pendingEvent = useRef<RunStatusEvent | null>(null);
  const runIdRef = useRef(runId);
  const busyRef = useRef(false);
  runIdRef.current = runId;

  if (boundId !== runId) {
    setBoundId(runId);
    setRun(null);
    setPhase('loading');
    setError(null);
    setActionError(null);
    setPending(null);
    setLive('connecting');
    pendingEvent.current = null;
  }

  const load = useCallback(async () => {
    loadRef.current?.abort();
    const ctrl = new AbortController();
    loadRef.current = ctrl;
    setPhase((current) => (current === 'ready' ? 'ready' : 'loading'));
    setError(null);

    try {
      const next = await getRun(runId, ctrl.signal);
      if (ctrl.signal.aborted || loadRef.current !== ctrl || runIdRef.current !== runId) return;
      const event = pendingEvent.current;
      setRun(event ? applyStatusEvent(next, event) : next);
      setPhase('ready');
    } catch (err) {
      if (ctrl.signal.aborted || isAbortError(err) || loadRef.current !== ctrl) return;
      setError(errorMessage(err));
      setPhase('error');
    }
  }, [runId]);

  useEffect(() => {
    const action = new AbortController();
    actionRef.current = action;
    void load();
    return () => {
      action.abort();
      loadRef.current?.abort();
      refreshRef.current?.abort();
    };
  }, [load]);

  useEffect(() => {
    const source = new EventSource(runEventsUrl(runId));
    let active = true;

    const onPayload = (raw: unknown) => {
      if (!active || runIdRef.current !== runId || typeof raw !== 'string') return;
      const event = parseStatusEvent(raw);
      if (!event) return;
      pendingEvent.current = event;
      setRun((current) => (current ? applyStatusEvent(current, event) : current));
      setLive('open');
      if (!isTerminal(event.status) || (event.finishedAt != null && event.durationMs != null)) return;

      refreshRef.current?.abort();
      const ctrl = new AbortController();
      refreshRef.current = ctrl;
      getRun(runId, ctrl.signal)
        .then((next) => {
          if (!active || ctrl.signal.aborted || runIdRef.current !== runId) return;
          const latest = pendingEvent.current;
          setRun(latest ? applyStatusEvent(next, latest) : next);
          setPhase('ready');
        })
        .catch((err: unknown) => {
          if (!active || ctrl.signal.aborted || isAbortError(err)) return;
          setActionError(errorMessage(err));
        });
    };

    source.onopen = () => {
      if (active) setLive('open');
    };
    source.onmessage = (event) => onPayload(event.data);
    source.addEventListener('status', (event) => onPayload((event as MessageEvent).data));
    source.onerror = () => {
      if (active) setLive('reconnecting');
    };

    return () => {
      active = false;
      source.close();
      refreshRef.current?.abort();
    };
  }, [runId]);

  async function withAction(name: string, task: (signal: AbortSignal) => Promise<void>): Promise<boolean> {
    const ctrl = actionRef.current;
    if (!ctrl || ctrl.signal.aborted || busyRef.current) return false;
    busyRef.current = true;
    setPending(name);
    setActionError(null);

    try {
      await task(ctrl.signal);
      if (ctrl.signal.aborted) return false;
      return true;
    } catch (err) {
      if (ctrl.signal.aborted || isAbortError(err)) return false;
      setActionError(errorMessage(err));
      return false;
    } finally {
      busyRef.current = false;
      if (!ctrl.signal.aborted) setPending(null);
    }
  }

  function changeStatus(status: RunStatus): Promise<boolean> {
    return withAction(status, async (signal) => {
      const updated = await patchRun(runId, status, signal);
      if (signal.aborted || runIdRef.current !== runId) return;
      pendingEvent.current = {
        status: updated.status,
        finishedAt: updated.finishedAt ?? null,
        durationMs: updated.durationMs ?? null,
      };
      setRun((current) => ({ ...updated, notes: updated.notes.length > 0 ? updated.notes : current?.notes ?? [] }));
    });
  }

  function addNote(input: CreateNoteInput): Promise<boolean> {
    return withAction('note', async (signal) => {
      const note = await createNote(runId, input, signal);
      if (signal.aborted || runIdRef.current !== runId) return;
      setRun((current) =>
        current ? { ...current, notes: [...current.notes.filter((item) => item.id !== note.id), note] } : current,
      );
    });
  }

  function removeNote(noteId: string): Promise<boolean> {
    return withAction(noteId, async (signal) => {
      await deleteNote(noteId, signal);
      if (signal.aborted || runIdRef.current !== runId) return;
      setRun((current) =>
        current ? { ...current, notes: current.notes.filter((note) => note.id !== noteId) } : current,
      );
    });
  }

  return {
    run,
    phase,
    error,
    actionError,
    pending,
    live,
    clearError: () => setActionError(null),
    reload: load,
    changeStatus,
    addNote,
    removeNote,
  };
}
