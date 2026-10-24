import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createNote, deleteNote } from '../api/notes';
import { getRun, patchRun } from '../api/runs';
import { RunDetailPage } from './RunDetailPage';
import { makeNote, makeRunDetail } from '../test/fixtures';

vi.mock('../api/runs', () => ({
  getRun: vi.fn(),
  patchRun: vi.fn(),
  runEventsUrl: (id: string) => `/api/v1/runs/${id}/events`,
}));

vi.mock('../api/notes', () => ({
  createNote: vi.fn(),
  deleteNote: vi.fn(),
}));

class MockEventSource {
  static instances: MockEventSource[] = [];
  url: string;
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  readyState = 0;
  closed = false;

  constructor(url: string) {
    this.url = url;
    MockEventSource.instances.push(this);
  }

  addEventListener() {}

  close() {
    this.closed = true;
    this.readyState = 2;
  }
}

function renderRun() {
  return render(
    <MemoryRouter initialEntries={['/runs/run-0002']}>
      <Routes>
        <Route path="/runs/:id" element={<RunDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  MockEventSource.instances = [];
  vi.stubGlobal('EventSource', MockEventSource);
  vi.clearAllMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('RunDetailPage', () => {
  it('closes the status stream when the page unmounts', async () => {
    vi.mocked(getRun).mockReturnValue(new Promise(() => undefined));
    const view = renderRun();
    expect(screen.getByText('Loading run')).toBeInTheDocument();
    expect(MockEventSource.instances.length).toBeGreaterThan(0);
    view.unmount();
    expect(MockEventSource.instances.every((source) => source.closed)).toBe(true);
  });

  it('updates the badge from a status event and can add or delete a note', async () => {
    const detail = makeRunDetail();
    vi.mocked(getRun).mockResolvedValue(detail);
    vi.mocked(patchRun).mockResolvedValue({ ...detail, status: 'passed', notes: detail.notes });
    vi.mocked(createNote).mockResolvedValue(makeNote({ id: 'note-0009', body: 'Retried cleanly.' }));
    vi.mocked(deleteNote).mockResolvedValue(undefined);
    const user = userEvent.setup();
    const view = renderRun();

    expect(await screen.findByTestId('run-status-badge')).toHaveTextContent('Failed');
    expect(screen.getByTestId('note-row')).toHaveTextContent('iSCSI reconnect');
    const source = MockEventSource.instances.find((item) => !item.closed);
    source?.onmessage?.({ data: '{"status":"running","finishedAt":null,"durationMs":null}' } as MessageEvent);
    expect(await screen.findByText('Running')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Pass' }));
    expect(await screen.findByText('Passed')).toBeInTheDocument();
    expect(patchRun).toHaveBeenCalledWith('run-0002', 'passed', expect.any(AbortSignal));

    await user.type(screen.getByLabelText('Author'), 'arun.k');
    await user.type(screen.getByLabelText('Note'), 'Retried cleanly.');
    await user.click(screen.getByTestId('note-add'));
    expect(await screen.findByText('Retried cleanly.')).toBeInTheDocument();

    await user.click(screen.getAllByRole('button', { name: 'Delete note' })[0]);
    expect(deleteNote).toHaveBeenCalled();

    view.unmount();
    expect(MockEventSource.instances.every((item) => item.closed)).toBe(true);
  });
});
