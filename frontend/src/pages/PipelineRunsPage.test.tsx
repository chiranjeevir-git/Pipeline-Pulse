import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../api/http';
import { getPipeline } from '../api/pipelines';
import { createRun, listRuns } from '../api/runs';
import { PipelineRunsPage } from './PipelineRunsPage';
import { makeRun, pipeline } from '../test/fixtures';

vi.mock('../api/pipelines', () => ({
  getPipeline: vi.fn(),
}));

vi.mock('../api/runs', () => ({
  listRuns: vi.fn(),
  createRun: vi.fn(),
  RUN_PAGE_SIZE: 20,
}));

function renderRuns() {
  return render(
    <MemoryRouter initialEntries={[`/pipelines/${pipeline.id}`]}>
      <Routes>
        <Route path="/pipelines/:id" element={<PipelineRunsPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getPipeline).mockResolvedValue(pipeline);
});

describe('PipelineRunsPage', () => {
  it('aborts an in-flight runs request when leaving the page', () => {
    let signal: AbortSignal | undefined;
    vi.mocked(listRuns).mockImplementation((_id, query) => {
      signal = query?.signal;
      return new Promise(() => undefined);
    });
    const view = renderRuns();
    expect(screen.getByText('Loading runs')).toBeInTheDocument();
    view.unmount();
    expect(signal?.aborted).toBe(true);
  });

  it('shows an empty state and an error state', async () => {
    vi.mocked(listRuns).mockResolvedValueOnce({ items: [], nextCursor: null });
    const user = userEvent.setup();
    const view = renderRuns();
    expect(await screen.findByText('No runs yet.')).toBeInTheDocument();

    view.unmount();
    vi.mocked(listRuns).mockRejectedValueOnce(new ApiError(404, 'not_found', 'Pipeline not found'));
    renderRuns();
    expect(await screen.findByText('Pipeline not found')).toBeInTheDocument();
    vi.mocked(listRuns).mockResolvedValueOnce({ items: [makeRun()], nextCursor: null });
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByTestId('run-row')).toBeInTheDocument();
    expect(screen.getByTestId('run-status-badge')).toHaveTextContent('Failed');
  });

  it('filters by status and loads the next page', async () => {
    vi.mocked(listRuns)
      .mockResolvedValueOnce({ items: [makeRun({ id: 'run-0001', status: 'passed' })], nextCursor: 'page-2' })
      .mockResolvedValueOnce({ items: [makeRun()], nextCursor: null })
      .mockResolvedValue({ items: [], nextCursor: null });
    const user = userEvent.setup();
    renderRuns();
    expect(await screen.findByTestId('run-load-more')).toBeInTheDocument();
    await user.click(screen.getByTestId('run-load-more'));
    await waitFor(() => expect(screen.getAllByTestId('run-row')).toHaveLength(2));
    expect(screen.queryByTestId('run-load-more')).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Filter by status'), 'failed');
    await waitFor(() =>
      expect(listRuns).toHaveBeenCalledWith(
        pipeline.id,
        expect.objectContaining({ status: 'failed', limit: 20 }),
      ),
    );
  });

  it('creates a queued run', async () => {
    const created = makeRun({
      id: 'run-0009',
      status: 'queued',
      finishedAt: undefined,
      durationMs: undefined,
      triggeredBy: 'priya.n',
      commitSha: 'abc1234def',
    });
    vi.mocked(listRuns).mockResolvedValue({ items: [], nextCursor: null });
    vi.mocked(createRun).mockResolvedValue(created);
    const user = userEvent.setup();
    renderRuns();
    await screen.findByText('No runs yet.');
    await user.type(screen.getByLabelText('Triggered by'), 'priya.n');
    await user.type(screen.getByLabelText('Commit SHA'), 'abc1234def');
    await user.click(screen.getByRole('button', { name: 'Create run' }));
    expect(await screen.findByText('run-0009')).toBeInTheDocument();
    expect(createRun).toHaveBeenCalledWith(
      pipeline.id,
      { triggeredBy: 'priya.n', commitSha: 'abc1234def' },
      expect.any(AbortSignal),
    );
  });
});
