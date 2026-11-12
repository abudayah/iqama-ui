import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useOverrideClamps } from './useOverrideClamps';
import * as scheduleService from '../services/schedule-service';
import type { DailySchedule, Override } from '../types/index';

vi.mock('../services/schedule-service', () => ({ fetchScheduleForRange: vi.fn() }));
const fetchRange = vi.mocked(scheduleService.fetchScheduleForRange);

const TODAY = '2026-11-11';
const ov = (patch: Partial<Override> = {}): Override => ({
  id: 1,
  prayer: 'fajr',
  overrideType: 'FIXED',
  value: '05:00',
  startDate: '2026-11-12',
  endDate: '2026-11-20',
  ...patch,
});
/** A schedule where Fajr is (or is not) adjusted. */
const days = (clamped: boolean): DailySchedule[] =>
  [
    {
      date: '2026-11-12',
      fajr: { azan: '06:00', iqama: '06:10', ...(clamped ? { iqama_clamped: true } : {}) },
    },
  ] as unknown as DailySchedule[];

beforeEach(() => {
  fetchRange.mockReset();
});

describe('useOverrideClamps', () => {
  it('flags an override whose prayer is adjusted', async () => {
    fetchRange.mockResolvedValue(days(true));
    const { result } = renderHook(() => useOverrideClamps([ov()], TODAY));
    await waitFor(() => expect([...result.current]).toEqual([1]));
  });

  it('does not flag an override that is not adjusted', async () => {
    fetchRange.mockResolvedValue(days(false));
    const { result } = renderHook(() => useOverrideClamps([ov()], TODAY));
    await waitFor(() => expect(fetchRange).toHaveBeenCalled());
    expect(result.current.size).toBe(0);
  });

  it('recomputes when only the value changes: clamped -> not clamped', async () => {
    fetchRange.mockResolvedValueOnce(days(true)).mockResolvedValueOnce(days(false));
    const { result, rerender } = renderHook(({ list }) => useOverrideClamps(list, TODAY), {
      initialProps: { list: [ov({ value: '05:00' })] },
    });
    await waitFor(() => expect(result.current.has(1)).toBe(true));
    rerender({ list: [ov({ value: '04:00' })] });
    // The old answer is not shown for the new value while it loads.
    expect(result.current.size).toBe(0);
    await waitFor(() => expect(fetchRange).toHaveBeenCalledTimes(2));
    expect(result.current.size).toBe(0);
  });

  it('recomputes when only the value changes: not clamped -> clamped', async () => {
    fetchRange.mockResolvedValueOnce(days(false)).mockResolvedValueOnce(days(true));
    const { result, rerender } = renderHook(({ list }) => useOverrideClamps(list, TODAY), {
      initialProps: { list: [ov({ value: '04:00' })] },
    });
    await waitFor(() => expect(fetchRange).toHaveBeenCalledTimes(1));
    rerender({ list: [ov({ value: '06:00' })] });
    await waitFor(() => expect(result.current.has(1)).toBe(true));
  });

  it('recomputes when only the type changes', async () => {
    fetchRange.mockResolvedValue(days(false));
    const { rerender } = renderHook(({ list }) => useOverrideClamps(list, TODAY), {
      initialProps: { list: [ov({ overrideType: 'FIXED', value: '05:00' })] },
    });
    await waitFor(() => expect(fetchRange).toHaveBeenCalledTimes(1));
    rerender({ list: [ov({ overrideType: 'OFFSET', value: '+5' })] });
    await waitFor(() => expect(fetchRange).toHaveBeenCalledTimes(2));
  });

  it('recomputes when the dates change and asks for the new range', async () => {
    fetchRange.mockResolvedValue(days(false));
    const { rerender } = renderHook(({ list }) => useOverrideClamps(list, TODAY), {
      initialProps: { list: [ov()] },
    });
    await waitFor(() => expect(fetchRange).toHaveBeenCalledTimes(1));
    rerender({ list: [ov({ startDate: '2026-12-01', endDate: '2026-12-05' })] });
    await waitFor(() => expect(fetchRange).toHaveBeenCalledTimes(2));
    expect(fetchRange).toHaveBeenLastCalledWith('2026-12-01', '2026-12-05');
  });

  it('drops the warning when the override is deleted', async () => {
    fetchRange.mockResolvedValue(days(true));
    const { result, rerender } = renderHook(({ list }) => useOverrideClamps(list, TODAY), {
      initialProps: { list: [ov()] },
    });
    await waitFor(() => expect(result.current.has(1)).toBe(true));
    rerender({ list: [] });
    await waitFor(() => expect(result.current.size).toBe(0));
  });

  it('shows no warning when the request fails', async () => {
    fetchRange.mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() => useOverrideClamps([ov()], TODAY));
    await waitFor(() => expect(fetchRange).toHaveBeenCalled());
    expect(result.current.size).toBe(0);
  });

  it('shares one request between overrides with the same range', async () => {
    fetchRange.mockResolvedValue(days(true));
    const list = [ov({ id: 1, prayer: 'fajr' }), ov({ id: 2, prayer: 'fajr', value: '05:30' })];
    const { result } = renderHook(() => useOverrideClamps(list, TODAY));
    await waitFor(() => expect(result.current.size).toBe(2));
    expect(fetchRange).toHaveBeenCalledTimes(1);
  });

  it('skips overrides that already ended', async () => {
    const { result } = renderHook(() =>
      useOverrideClamps([ov({ startDate: '2026-10-01', endDate: '2026-10-05' })], TODAY),
    );
    await new Promise((r) => setTimeout(r, 20));
    expect(fetchRange).not.toHaveBeenCalled();
    expect(result.current.size).toBe(0);
  });
});
