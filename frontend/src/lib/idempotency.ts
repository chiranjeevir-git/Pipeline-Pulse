export interface IdempotencyAttempt {
  key: string;
  body: string;
}

export function reuseIdempotencyKey(previous: IdempotencyAttempt | null, body: string): IdempotencyAttempt {
  if (previous?.body === body) return previous;
  return { key: crypto.randomUUID(), body };
}
