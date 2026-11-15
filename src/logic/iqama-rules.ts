import type { PrayerName } from '../types/index';
import type {
  IqamaPreviewResponse,
  PrayerRule,
  RuleBase,
  RuleSet,
  Weekday,
} from '../types/iqama-rules';
import i18n from '../i18n';
import { joinList } from '../i18n/list';
import { formatTime12 } from '../i18n/format-time';
import { formatWeekdayName, getIntlLocale } from '../i18n/locale';

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
  SUN: 'Sunday',
  MON: 'Monday',
  TUE: 'Tuesday',
  WED: 'Wednesday',
  THU: 'Thursday',
  FRI: 'Friday',
  SAT: 'Saturday',
};

const signed = (n: number) => `${n < 0 ? '−' : '+'} ${Math.abs(n)} ${i18n.t('ruleDescribe.min')}`;

function describeBase(base: RuleBase): string {
  switch (base.type) {
    case 'OFFSET':
      return base.minutes === 0
        ? i18n.t('ruleDescribe.atAzan')
        : i18n.t('ruleDescribe.azan', { offset: signed(base.minutes) });
    case 'FIXED_TIME':
      return i18n.t('ruleDescribe.fixed', { time: formatTime12(base.time) });
    case 'SCALED_GAP': {
      const gaps = base.points.map((p) => p.gapMinutes);
      return i18n.t('ruleDescribe.scaled', {
        min: Math.min(...gaps),
        max: Math.max(...gaps),
      });
    }
    case 'SEASONAL':
      return i18n.t('ruleDescribe.seasonal', { count: base.segments.length });
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
        ? i18n.t('ruleDescribe.roundUp', { step: s })
        : rounding.mode === 'FLOOR'
          ? i18n.t('ruleDescribe.roundDown', { step: s })
          : i18n.t('ruleDescribe.roundNearest', { step: s }),
    );
  }
  if (limits?.minAfterAzan !== undefined)
    parts.push(i18n.t('ruleDescribe.minAfterAzan', { n: limits.minAfterAzan }));
  if (limits?.latestBeforeSunrise !== undefined)
    parts.push(i18n.t('ruleDescribe.minBeforeSunrise', { n: limits.latestBeforeSunrise }));
  const adj = Object.entries(weekdayAdjust ?? {}).filter(([, v]) => v);
  if (adj.length)
    parts.push(
      joinList(
        adj.map(
          ([d, v]) =>
            `${formatWeekdayName(WEEKDAY_LABELS[d as Weekday], getIntlLocale())} ${signed(v as number)}`,
        ),
      ),
    );
  if (weeklyLock) parts.push(i18n.t('ruleDescribe.weeklyLock'));
  return joinList(parts);
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

/** Format a YYYY-MM-DD date using the requested locale. */
export function formatDay(date: string, locale = 'en-US'): string {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString(locale, {
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
