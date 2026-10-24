export const PRODUCTS = ['flasharray', 'flashblade', 'hyperscale'] as const;
export type Product = (typeof PRODUCTS)[number];

export const RUN_STATUSES = ['queued', 'running', 'passed', 'failed', 'flaky'] as const;
export type RunStatus = (typeof RUN_STATUSES)[number];

export function isRunStatus(value: unknown): value is RunStatus {
  return typeof value === 'string' && (RUN_STATUSES as readonly string[]).includes(value);
}

export function isProduct(value: unknown): value is Product {
  return typeof value === 'string' && (PRODUCTS as readonly string[]).includes(value);
}

export interface Pipeline {
  id: string;
  name: string;
  product: Product;
  createdAt: string;
}

export interface CreatePipelineInput {
  name: string;
  product: Product;
}

export interface UpdatePipelineInput {
  name?: string;
  product?: Product;
}

export interface Run {
  id: string;
  pipelineId: string;
  status: RunStatus;
  startedAt: string;
  finishedAt?: string;
  durationMs?: number;
  triggeredBy: string;
  commitSha: string;
}

export interface CreateRunInput {
  triggeredBy: string;
  commitSha: string;
}

export interface Note {
  id: string;
  runId: string;
  author: string;
  body: string;
  createdAt: string;
}

export interface CreateNoteInput {
  author: string;
  body: string;
}

export interface RunDetail extends Run {
  notes: Note[];
}

export interface RunPage {
  items: Run[];
  nextCursor: string | null;
}

export interface RunStatusEvent {
  status: RunStatus;
  finishedAt?: string | null;
  durationMs?: number | null;
}
