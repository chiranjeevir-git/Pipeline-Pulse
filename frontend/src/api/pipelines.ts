import { ApiError, apiRequest } from './http';
import type { CreatePipelineInput, Pipeline, UpdatePipelineInput } from './types';

export function parsePipeline(data: unknown): Pipeline {
  if (!data || typeof data !== 'object' || typeof (data as Pipeline).id !== 'string') {
    throw new ApiError(500, 'invalid_response', 'Pipeline response was missing an id.');
  }
  return data as Pipeline;
}

export function parsePipelineList(data: unknown): Pipeline[] {
  if (!Array.isArray(data)) {
    throw new ApiError(500, 'invalid_response', 'Pipeline list was not an array.');
  }
  return data as Pipeline[];
}

export async function listPipelines(signal?: AbortSignal): Promise<Pipeline[]> {
  const data = await apiRequest<unknown>('/pipelines', { signal });
  return parsePipelineList(data);
}

export async function createPipeline(
  input: CreatePipelineInput,
  idempotencyKey: string,
  signal?: AbortSignal,
): Promise<Pipeline> {
  const data = await apiRequest<unknown>('/pipelines', {
    method: 'POST',
    json: input,
    signal,
    headers: { 'Idempotency-Key': idempotencyKey },
  });
  return parsePipeline(data);
}

export async function getPipeline(id: string, signal?: AbortSignal): Promise<Pipeline> {
  const data = await apiRequest<unknown>(`/pipelines/${encodeURIComponent(id)}`, { signal });
  return parsePipeline(data);
}

export async function updatePipeline(
  id: string,
  patch: UpdatePipelineInput,
  signal?: AbortSignal,
): Promise<Pipeline> {
  const data = await apiRequest<unknown>(`/pipelines/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    json: patch,
    signal,
  });
  return parsePipeline(data);
}

export function deletePipeline(id: string, signal?: AbortSignal): Promise<void> {
  return apiRequest<void>(`/pipelines/${encodeURIComponent(id)}`, { method: 'DELETE', signal });
}
