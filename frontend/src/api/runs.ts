import { API_ROOT, ApiError, apiRequest } from './http';
import { isRunStatus, type CreateRunInput, type Run, type RunDetail, type RunPage, type RunStatus } from './types';

export const RUN_PAGE_SIZE = 20;

export interface RunQuery {
  status?: RunStatus;
  limit?: number;
  cursor?: string;
}

export function runsPath(pipelineId: string, query: RunQuery = {}): string {
  const params = new URLSearchParams();
  if (query.status) params.set('status', query.status);
  if (query.limit != null) params.set('limit', String(query.limit));
  if (query.cursor) params.set('cursor', query.cursor);
  const qs = params.toString();
  return `/pipelines/${encodeURIComponent(pipelineId)}/runs${qs ? `?${qs}` : ''}`;
}

export function runEventsUrl(runId: string): string {
  return `${API_ROOT}/runs/${encodeURIComponent(runId)}/events`;
}

export function parseRun(data: unknown): Run {
  if (!data || typeof data !== 'object') {
    throw new ApiError(500, 'invalid_response', 'Run response was empty.');
  }
  const run = data as Run;
  if (typeof run.id !== 'string' || !isRunStatus(run.status)) {
    throw new ApiError(500, 'invalid_response', 'Run response was missing an id or status.');
  }
  return run;
}

export function parseRunDetail(data: unknown): RunDetail {
  const run = parseRun(data);
  const notes = (data as { notes?: unknown }).notes;
  return { ...run, notes: Array.isArray(notes) ? notes : [] };
}

export function parseRunPage(data: unknown): RunPage {
  if (!data || typeof data !== 'object' || !Array.isArray((data as { items?: unknown }).items)) {
    throw new ApiError(500, 'invalid_response', 'Run list was missing items.');
  }
  const body = data as { items: Run[]; nextCursor?: unknown };
  const nextCursor = typeof body.nextCursor === 'string' && body.nextCursor.length > 0 ? body.nextCursor : null;
  return { items: body.items, nextCursor };
}

export async function listRuns(
  pipelineId: string,
  query: RunQuery & { signal?: AbortSignal } = {},
): Promise<RunPage> {
  const { signal, ...params } = query;
  const data = await apiRequest<unknown>(runsPath(pipelineId, params), { signal });
  return parseRunPage(data);
}

export async function createRun(pipelineId: string, input: CreateRunInput, signal?: AbortSignal): Promise<Run> {
  const data = await apiRequest<unknown>(`/pipelines/${encodeURIComponent(pipelineId)}/runs`, {
    method: 'POST',
    json: input,
    signal,
  });
  return parseRun(data);
}

export async function getRun(id: string, signal?: AbortSignal): Promise<RunDetail> {
  const data = await apiRequest<unknown>(`/runs/${encodeURIComponent(id)}`, { signal });
  return parseRunDetail(data);
}

export async function patchRun(id: string, status: RunStatus, signal?: AbortSignal): Promise<RunDetail> {
  const data = await apiRequest<unknown>(`/runs/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    json: { status },
    signal,
  });
  return parseRunDetail(data);
}
