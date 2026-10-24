import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useNow } from './useNow';

afterEach(() => {
  vi.useRealTimers();
});

describe('useNow', () => {
  it('clears the interval when the clock stops or the view unmounts', () => {
    vi.useFakeTimers();
    const view = renderHook(({ active }: { active: boolean }) => useNow(active), {
      initialProps: { active: false },
    });
    expect(vi.getTimerCount()).toBe(0);

    view.rerender({ active: true });
    expect(vi.getTimerCount()).toBe(1);

    view.rerender({ active: false });
    expect(vi.getTimerCount()).toBe(0);

    view.rerender({ active: true });
    view.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
