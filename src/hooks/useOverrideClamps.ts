import { useEffect, useState } from 'react';
import { fetchScheduleForRange } from '../services/schedule-service';
import type { DailySchedule, Override } from '../types/index';

const WINDOW_DAYS = 31;

function addDays(date: string, n: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

type Item = [
  id: number,
  prayer: Override['prayer'],
  type: string,
  value: string,
  start: string,
  end: string,
];

/**
 * Ids of overrides whose iqama the engine's guardrails moved (iqama_clamped).
 *
 * The result is recomputed whenever anything that changes the time changes:
 * prayer, type, value or dates (and an override that is added or removed). While
 * a new result is loading, the old one is not shown for the new key. A failed
 * request shows no warning. Overrides with the same date range share one request.
 *
 * shortcut: looks only at the first 31 days from max(startDate, today) and
 * cannot tell an override clamp from a rule clamp, because the schedule only
 * says "this prayer was adjusted". Upgrade if the engine gains an
 * override-specific check.
 */
export function useOverrideClamps(overrides: Override[], today: string): Set<number> {
  const key = JSON.stringify(
    overrides.map((o) => [
      o.id,
      o.prayer,
      o.overrideType,
      o.value,
      o.startDate.slice(0, 10),
      o.endDate.slice(0, 10),
    ]),
  );
  const [result, setResult] = useState<{ key: string; ids: Set<number> }>({
    key: '',
    ids: new Set(),
  });

  useEffect(() => {
    let cancelled = false;
    const items = JSON.parse(key) as Item[];
    const requests = new Map<string, Promise<DailySchedule[] | null>>();
    const load = (from: string, to: string) => {
      const k = `${from}|${to}`;
      let p = requests.get(k);
      if (!p) {
        p = fetchScheduleForRange(from, to).catch(() => null); // warning is best-effort
        requests.set(k, p);
      }
      return p;
    };
    Promise.all(
      items.map(async ([id, prayer, , , start, end]) => {
        if (end < today) return null;
        const from = start > today ? start : today;
        const to = addDays(from, WINDOW_DAYS - 1);
        const days = await load(from, end < to ? end : to);
        return days?.some((d) => d[prayer]?.iqama_clamped) ? id : null;
      }),
    ).then((ids) => {
      if (!cancelled) setResult({ key, ids: new Set(ids.filter((i): i is number => i !== null)) });
    });
    return () => {
      cancelled = true;
    };
  }, [key, today]);

  return result.key === key ? result.ids : EMPTY;
}

const EMPTY: Set<number> = new Set();
