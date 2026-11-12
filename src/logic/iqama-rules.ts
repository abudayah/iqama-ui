import type { PrayerName } from '../types/index';
import type {
  IqamaPreviewResponse,
  PrayerRule,
  RuleBase,
  RuleSet,
  Weekday,
} from '../types/iqama-rules';

const PRAYER_LABELS: Record<string, string> = {
  fajr: 'Fajr',
  dhuhr: 'Dhuhr',
  asr: 'Asr',
  maghrib: 'Maghrib',
  isha: 'Isha',
};

/** Display name for a prayer; falls back to a capitalised key for unknown ones. */
export const prayerLabel = (name: string): string =>
  PRAYER_LABELS[name] ?? name.charAt(0).toUpperCase() + name.slice(1);

const WEEKDAY_LABELS: Record<Weekday, string> = {
  SUN: 'Sun',
  MON: 'Mon',
  TUE: 'Tue',
  WED: 'Wed',
  THU: 'Thu',
  FRI: 'Fri',
  SAT: 'Sat',
};

const signed = (n: number) => `${n < 0 ? '−' : '+'} ${Math.abs(n)} min`;

function describeBase(base: RuleBase): string {
  switch (base.type) {
    case 'OFFSET':
      return base.minutes === 0 ? 'At Azan' : `Azan ${signed(base.minutes)}`;
    case 'FIXED_TIME':
      return `Fixed at ${base.time}`;
    case 'SCALED_GAP': {
      const gaps = base.points.map((p) => p.gapMinutes);
      return `Gap after Azan scales from ${Math.min(...gaps)} to ${Math.max(...gaps)} min`;
    }
    case 'SEASONAL':
      return `Seasonal fixed times (${base.segments.length} periods)`;
  }
}

/** Plain-English one-liner, e.g. "Azan + 5 min, rounded up to the next 5". */
export function describeRule(rule: PrayerRule): string {
  const parts = [describeBase(rule.base)];
  const { rounding, limits, weekdayAdjust, weeklyLock } = rule;
  if (rounding && rounding.step > 1) {
    const s = rounding.step;
    parts.push(
      rounding.mode === 'CEIL'
        ? `rounded up to the next ${s}`
        : rounding.mode === 'FLOOR'
          ? `rounded down to the previous ${s}`
          : `rounded to the nearest ${s}`,
    );
  }
  if (limits?.minAfterAzan !== undefined)
    parts.push(`at least ${limits.minAfterAzan} min after Azan`);
  if (limits?.latestBeforeSunrise !== undefined)
    parts.push(`at least ${limits.latestBeforeSunrise} min before sunrise`);
  const adj = Object.entries(weekdayAdjust ?? {}).filter(([, v]) => v);
  if (adj.length)
    parts.push(
      adj.map(([d, v]) => `${WEEKDAY_LABELS[d as Weekday]} ${signed(v as number)}`).join(', '),
    );
  if (weeklyLock) parts.push('held Friday to Thursday');
  return parts.join(', ');
}

export function isFriday(date: string): boolean {
  return new Date(`${date}T12:00:00Z`).getUTCDay() === 5;
}

/** The next `count` Fridays on or after `from` (YYYY-MM-DD). */
export function upcomingFridays(from: string, count: number): string[] {
  const d = new Date(`${from}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + ((5 - d.getUTCDay() + 7) % 7));
  return Array.from({ length: count }, (_, i) => {
    const x = new Date(d);
    x.setUTCDate(x.getUTCDate() + 7 * i);
    return x.toISOString().slice(0, 10);
  });
}

/** JSON with sorted keys, so equal data always gives equal text. */
export function canonicalJson(value: unknown): string {
  return JSON.stringify(value, (_k, v: unknown) =>
    v && typeof v === 'object' && !Array.isArray(v)
      ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => a.localeCompare(b)))
      : v,
  );
}

export const sameRule = (a: PrayerRule, b: PrayerRule) => canonicalJson(a) === canonicalJson(b);

/** Prayers whose rule differs between `base` and `draft`. */
export function changedPrayers(base: RuleSet, draft: Partial<RuleSet>): PrayerName[] {
  return (Object.keys(draft) as PrayerName[]).filter((p) => !sameRule(draft[p]!, base[p]));
}

/** Success text that says what the save did, by engine mode. */
export function savedMessage(mode: 'legacy' | 'shadow' | 'db', effectiveFrom: string): string {
  switch (mode) {
    case 'db':
      return `Saved and published. The public schedule uses these rules from ${effectiveFrom}.`;
    case 'shadow':
      return 'Saved. The engine is still comparing in the background; the public schedule is unchanged.';
    case 'legacy':
      return 'Saved. The public schedule still uses the built-in rules.';
  }
}

/** "Fri, Nov 13" for a YYYY-MM-DD date. */
export function formatDay(date: string): string {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

type Summary = IqamaPreviewResponse['summary'];

/**
 * Days that the safety rules move BECAUSE of this change (not days that were
 * already moved before). Uses the engine's per-prayer `byPrayer[p].newlyMoved`
 * for the changed prayers; else the total `summary.newlyMoved`; else, for an
 * older engine, proposed minus current.
 *
 * shortcut: the older-engine fallback is per prayer only if byPrayer[p] has
 * daysClampedCurrent, else it compares the overall totals (days with any move),
 * which can hide a new move on one prayer behind a fixed one on another. Drop
 * the fallback once every engine sends newlyMoved.
 */
export function newlyMovedDays(summary: Summary, changed: PrayerName[]): number {
  if (changed.every((p) => typeof summary.byPrayer[p]?.newlyMoved === 'number')) {
    return changed.reduce((n, p) => n + summary.byPrayer[p].newlyMoved!, 0);
  }
  if (typeof summary.newlyMoved === 'number') return summary.newlyMoved;
  const perPrayer = changed.every((p) => summary.byPrayer[p]?.daysClampedCurrent !== undefined);
  if (perPrayer) {
    return changed.reduce(
      (n, p) =>
        n + Math.max(0, summary.byPrayer[p].daysClamped - summary.byPrayer[p].daysClampedCurrent!),
      0,
    );
  }
  return Math.max(0, summary.daysClamped - summary.daysClampedCurrent);
}
