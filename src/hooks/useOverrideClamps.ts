import { useEffect, useState } from 'react';
import { fetchScheduleForRange } from '../services/schedule-service';
import type { Override } from '../types/index';

const WINDOW_DAYS = 31;

function addDays(date: string, n: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/**
 * Ids of overrides whose iqama the backend guardrails moved (iqama_clamped).
 * shortcut: checks only the first 31 days from max(startDate, today), upgrade
 * if the backend gains an override-specific preview endpoint.
 */
export function useOverrideClamps(overrides: Override[], today: string): Set<number> {
  const [clamped, setClamped] = useState<Set<number>>(new Set());
  const key = JSON.stringify(overrides.map((o) => [o.id, o.prayer, o.startDate, o.endDate]));

  useEffect(() => {
    let cancelled = false;
    const list = JSON.parse(key) as [number, Override['prayer'], string, string][];
    Promise.all(
      list.map(async ([id, prayer, startRaw, endRaw]) => {
        const start = startRaw.slice(0, 10);
        const end = endRaw.slice(0, 10);
        if (end < today) return null;
        const from = start > today ? start : today;
        const to = addDays(from, WINDOW_DAYS - 1);
        try {
          const days = await fetchScheduleForRange(from, end < to ? end : to);
          return days.some((d) => d[prayer]?.iqama_clamped) ? id : null;
        } catch {
          return null; // warning is best-effort
        }
      }),
    ).then((ids) => {
      if (!cancelled) setClamped(new Set(ids.filter((i): i is number => i !== null)));
    });
    return () => {
      cancelled = true;
    };
  }, [key, today]);

  return clamped;
}
