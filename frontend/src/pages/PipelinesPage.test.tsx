import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../api/http';
import { createPipeline, deletePipeline, listPipelines } from '../api/pipelines';
import App from '../App';
import { pipeline } from '../test/fixtures';

vi.mock('../api/pipelines', () => ({
  listPipelines: vi.fn(),
  createPipeline: vi.fn(),
  updatePipeline: vi.fn(),
  deletePipeline: vi.fn(),
  getPipeline: vi.fn(),
}));

function renderHome() {
  return render(
    <MemoryRouter>
      <App />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('PipelinesPage', () => {
  it('shows a loading state and aborts the request on the way out', () => {
    let signal: AbortSignal | undefined;
    vi.mocked(listPipelines).mockImplementation((next) => {
      signal = next;
      return new Promise(() => undefined);
    });
    const view = renderHome();
    expect(screen.getByText('Loading pipelines')).toBeInTheDocument();
    expect(screen.getByTestId('nav-home')).toHaveAttribute('href', '/');
    expect(screen.getByTestId('pipeline-create')).toBeInTheDocument();
    view.unmount();
    expect(signal?.aborted).toBe(true);
  });

  it('shows an empty state', async () => {
    vi.mocked(listPipelines).mockResolvedValue([]);
    renderHome();
    expect(await screen.findByText('No pipelines yet.')).toBeInTheDocument();
  });

  it('shows an error and retries', async () => {
    vi.mocked(listPipelines)
      .mockRejectedValueOnce(new ApiError(500, 'db_down', 'Database unavailable'))
      .mockResolvedValueOnce([pipeline]);
    const user = userEvent.setup();
    renderHome();
    expect(await screen.findByText('Database unavailable')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByTestId('pipeline-row')).toHaveTextContent('FlashArray Nightly');
  });

  it('creates a pipeline and sends the name and product', async () => {
    const created = { ...pipeline, id: 'pl-new', name: 'Nightly' };
    vi.mocked(listPipelines).mockResolvedValueOnce([]).mockResolvedValue([created]);
    vi.mocked(createPipeline).mockResolvedValue(created);
    const user = userEvent.setup();
    renderHome();
    await screen.findByText('No pipelines yet.');
    await user.type(screen.getByLabelText('Name'), 'Nightly');
    await user.selectOptions(screen.getByLabelText('Product'), 'flashblade');
    await user.click(screen.getByTestId('pipeline-create'));
    expect(await screen.findByText('Nightly')).toBeInTheDocument();
    expect(createPipeline).toHaveBeenCalledWith(
      { name: 'Nightly', product: 'flashblade' },
      expect.any(String),
      expect.any(AbortSignal),
    );
  });

  it('deletes a pipeline inline', async () => {
    vi.mocked(listPipelines).mockResolvedValueOnce([pipeline]).mockResolvedValue([]);
    vi.mocked(deletePipeline).mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderHome();
    expect(await screen.findByTestId('pipeline-row')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(screen.queryByText('FlashArray Nightly')).not.toBeInTheDocument());
    expect(deletePipeline).toHaveBeenCalledWith(pipeline.id, expect.any(AbortSignal));
  });
});
