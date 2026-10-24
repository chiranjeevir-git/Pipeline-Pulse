import { isRunStatus, type Product, type RunDetail, type RunStatus, type RunStatusEvent } from '../api/types';

const PRODUCT_LABELS: Record<Product, string> = {
  flasharray: 'FlashArray',
  flashblade: 'FlashBlade',
  hyperscale: 'Hyperscale',
};

const STATUS_LABELS: Record<RunStatus, string> = {
  queued: 'Queued',
  running: 'Running',
  passed: 'Passed',
  failed: 'Failed',
  flaky: 'Flaky',
};

export function productLabel(product: Product): string {
  return PRODUCT_LABELS[product];
}

export function statusLabel(status: RunStatus): string {
  return STATUS_LABELS[status];
}

export function isTerminal(status: RunStatus): boolean {
  return status === 'passed' || status === 'failed' || status === 'flaky';
}

export function isLiveStatus(status: RunStatus): boolean {
  return status === 'queued' || status === 'running';
}

export interface StatusAction {
  status: RunStatus;
  label: string;
  hint: string;
  enabled: (current: RunStatus) => boolean;
}

export const STATUS_ACTIONS: readonly StatusAction[] = [
  {
    status: 'running',
    label: 'Start',
    hint: 'Only a queued run can be started.',
    enabled: (current) => current === 'queued',
  },
  {
    status: 'passed',
    label: 'Pass',
    hint: 'This run already passed.',
    enabled: (current) => current !== 'passed',
  },
  {
    status: 'failed',
    label: 'Fail',
    hint: 'This run already failed.',
    enabled: (current) => current !== 'failed',
  },
  {
    status: 'flaky',
    label: 'Mark flaky',
    hint: 'This run is already marked flaky.',
    enabled: (current) => current !== 'flaky',
  },
];

export function parseStatusEvent(raw: string): RunStatusEvent | null {
  try {
    const data = JSON.parse(raw) as {
      status?: unknown;
      finishedAt?: unknown;
      durationMs?: unknown;
    };
    if (!isRunStatus(data.status)) return null;
    const finishedAt = typeof data.finishedAt === 'string' || data.finishedAt === null ? data.finishedAt : undefined;
    const durationMs = typeof data.durationMs === 'number' || data.durationMs === null ? data.durationMs : undefined;
    return { status: data.status, finishedAt, durationMs };
  } catch {
    return null;
  }
}

export function applyStatusEvent(run: RunDetail, event: RunStatusEvent): RunDetail {
  return {
    ...run,
    status: event.status,
    finishedAt: event.finishedAt === undefined ? run.finishedAt : event.finishedAt ?? undefined,
    durationMs: event.durationMs === undefined ? run.durationMs : event.durationMs ?? undefined,
  };
}
