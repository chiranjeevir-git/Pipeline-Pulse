import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiRequest } from './http';
import { createPipeline } from './pipelines';
import { runEventsUrl, runsPath } from './runs';

afterEach(() => {
  vi.unstubAllGlobals();
});

function jsonResponse(status: number, body?: unknown): Response {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('apiRequest', () => {
  it('returns nothing for an empty 204', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse(204)));
    await expect(apiRequest('/notes/note-1', { method: 'DELETE' })).resolves.toBeUndefined();
  });

  it('reads the error envelope', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse(400, { error: { code: 'invalid_name', message: 'Name is required' } })),
    );
    await expect(apiRequest('/pipelines')).rejects.toEqual(expect.any(ApiError));
    await expect(apiRequest('/pipelines')).rejects.toMatchObject({
      status: 400,
      code: 'invalid_name',
      message: 'Name is required',
    });
  });
});

describe('createPipeline', () => {
  it('sends Idempotency-Key with the create body', async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse(201, {
        id: 'pl-1',
        name: 'Nightly',
        product: 'flasharray',
        createdAt: '2026-10-01T00:00:00Z',
      }),
    );
    vi.stubGlobal('fetch', fetchMock);
    await createPipeline({ name: 'Nightly', product: 'flasharray' }, 'key-1');
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/pipelines',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'Idempotency-Key': 'key-1' }),
      }),
    );
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const body = JSON.parse(String(init.body));
    expect(body).toEqual({ name: 'Nightly', product: 'flasharray' });
  });
});

describe('run queries', () => {
  it('builds a filterable cursor query and the event stream url', () => {
    expect(runsPath('pl/1', { status: 'failed', limit: 20, cursor: 'next 1' })).toBe(
      '/pipelines/pl%2F1/runs?status=failed&limit=20&cursor=next+1',
    );
    expect(runEventsUrl('run/1')).toBe('/api/v1/runs/run%2F1/events');
  });
});
