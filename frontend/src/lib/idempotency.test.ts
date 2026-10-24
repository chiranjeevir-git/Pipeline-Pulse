import { afterEach, describe, expect, it, vi } from 'vitest';
import { reuseIdempotencyKey } from './idempotency';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('reuseIdempotencyKey', () => {
  it('keeps the key for the same body and rotates it when the body changes', () => {
    vi.spyOn(crypto, 'randomUUID')
      .mockReturnValueOnce('00000000-0000-4000-8000-000000000001')
      .mockReturnValueOnce('00000000-0000-4000-8000-000000000002');
    const first = reuseIdempotencyKey(null, '{"name":"A"}');
    const second = reuseIdempotencyKey(first, '{"name":"A"}');
    const third = reuseIdempotencyKey(second, '{"name":"B"}');
    expect(first.key).toBe('00000000-0000-4000-8000-000000000001');
    expect(second).toBe(first);
    expect(third).toEqual({ key: '00000000-0000-4000-8000-000000000002', body: '{"name":"B"}' });
  });
});
