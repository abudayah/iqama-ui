/**
 * Unit tests for useQiyamConfig hook.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useQiyamConfig } from './useQiyamConfig';

vi.mock('../services/hijri-calendar-service', () => ({
  fetchQiyamConfig: vi.fn(),
  saveQiyamConfig: vi.fn(),
}));

import { fetchQiyamConfig, saveQiyamConfig } from '../services/hijri-calendar-service';

const mockFetch = fetchQiyamConfig as ReturnType<typeof vi.fn>;
const mockSave = saveQiyamConfig as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useQiyamConfig — fetch on mount', () => {
  it('calls fetchQiyamConfig on mount', async () => {
    mockFetch.mockResolvedValue(null);

    renderHook(() => useQiyamConfig());

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  it('sets config from the resolved response', async () => {
    const fixture = { hijri_year: 1446, start_time: '02:00' };
    mockFetch.mockResolvedValue(fixture);

    const { result } = renderHook(() => useQiyamConfig());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.config).toEqual(fixture);
    expect(result.current.error).toBeNull();
  });

  it('sets config to null when server returns null', async () => {
    mockFetch.mockResolvedValue(null);

    const { result } = renderHook(() => useQiyamConfig());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.config).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('sets error when fetchQiyamConfig rejects', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useQiyamConfig());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('Network error');
    expect(result.current.config).toBeNull();
  });
});

describe('useQiyamConfig — save', () => {
  it('calls saveQiyamConfig with the provided startTime', async () => {
    mockFetch.mockResolvedValue(null);
    mockSave.mockResolvedValue(undefined);

    const { result } = renderHook(() => useQiyamConfig());

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.save('02:30');
    });

    expect(mockSave).toHaveBeenCalledTimes(1);
    expect(mockSave).toHaveBeenCalledWith('02:30');
  });

  it('sets saveSuccess to true on successful save', async () => {
    mockFetch.mockResolvedValue(null);
    mockSave.mockResolvedValue(undefined);

    const { result } = renderHook(() => useQiyamConfig());

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.save('02:30');
    });

    expect(result.current.saveSuccess).toBe(true);
    expect(result.current.saving).toBe(false);
    expect(result.current.saveError).toBeNull();
  });

  it('sets saveError on failed save', async () => {
    mockFetch.mockResolvedValue(null);
    mockSave.mockRejectedValue(new Error('Forbidden'));

    const { result } = renderHook(() => useQiyamConfig());

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.save('02:30');
    });

    expect(result.current.saveError).toBe('Forbidden');
    expect(result.current.saving).toBe(false);
    expect(result.current.saveSuccess).toBe(false);
  });

  it('resets saveError and saveSuccess before each save attempt', async () => {
    mockFetch.mockResolvedValue(null);
    // First call fails, second succeeds
    mockSave.mockRejectedValueOnce(new Error('Forbidden')).mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useQiyamConfig());

    await waitFor(() => expect(result.current.loading).toBe(false));

    // First save — should fail
    await act(async () => {
      await result.current.save('02:30');
    });
    expect(result.current.saveError).toBe('Forbidden');

    // Second save — should succeed and clear the previous error
    await act(async () => {
      await result.current.save('03:00');
    });
    expect(result.current.saveError).toBeNull();
    expect(result.current.saveSuccess).toBe(true);
  });
});
