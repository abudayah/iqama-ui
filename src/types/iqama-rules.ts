/** Types for the /api/v1/admin/iqama-rules contract (mirrors the backend). */
import type { PrayerName } from './index';

export type Weekday = 'SUN' | 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT';
export const WEEKDAYS: readonly Weekday[] = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
export const PRAYER_NAMES: readonly PrayerName[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

export type SegmentStart =
  | { kind: 'DATE'; month: number; day: number }
  | { kind: 'FIRST_FRIDAY'; month: number };

export type RuleBase =
  | { type: 'OFFSET'; minutes: number }
  | { type: 'FIXED_TIME'; time: string }
  | { type: 'SCALED_GAP'; points: { azan: string; gapMinutes: number }[] }
  | { type: 'SEASONAL'; segments: { start: SegmentStart; time: string }[] };

export interface RuleLimits {
  minAfterAzan?: number;
  latestBeforeSunrise?: number;
}
export type RoundingMode = 'CEIL' | 'FLOOR' | 'NEAREST';

export interface PrayerRule {
  base: RuleBase;
  limits?: RuleLimits;
  rounding?: { mode: RoundingMode; step: number };
  weekdayAdjust?: Partial<Record<Weekday, number>>;
  weeklyLock?: boolean;
}
export type RuleSet = Record<PrayerName, PrayerRule>;

export interface IqamaRuleVersion {
  id: number;
  effectiveFrom: string;
  settings: string; // JSON RuleSet
  createdBy: string;
  createdAt: string;
  /** Why the change was made (absent on older engines). */
  reason?: string | null;
}

export interface IqamaRulesConfig {
  mode: 'legacy' | 'shadow' | 'db';
  currentRevision: number;
  versions: IqamaRuleVersion[];
  effective: RuleSet | null;
  today: string;
  timezone: string;
  defaultEffectiveFrom: string;
}

// ── Catalog ──────────────────────────────────────────────────────────────────

export interface CatalogField {
  name: string;
  kind: 'int' | 'time' | 'list' | 'oneOf';
  min?: number;
  max?: number;
  minItems?: number;
  note?: string;
  item?: CatalogField[];
  options?: { kind: string; fields: string[] }[];
}

export interface IqamaCatalog {
  prayers: {
    name: PrayerName;
    weeklyLockAllowed: boolean;
    fridayStartRequired: boolean;
    sunriseLimitAllowed: boolean;
  }[];
  baseTypes: { type: RuleBase['type']; label: string; fields: CatalogField[] }[];
  modifiers: {
    limits: {
      minAfterAzan: { min: number; max: number };
      latestBeforeSunrise: { min: number; max: number };
    };
    rounding: { modes: RoundingMode[]; steps: number[] };
    weekdayAdjust: { weekdays: Weekday[]; min: number; max: number };
  };
  guardrails: {
    minGapAfterAzanMinutes: number;
    fajrEndsBeforeSunriseMinutes: number;
    /** Every iqama lands on a multiple of this (absent on older engines). */
    iqamaStepMinutes?: number;
  };
}

// ── Preview ──────────────────────────────────────────────────────────────────

export interface PreviewDayPrayer {
  azan: string;
  current: { iqama: string; clamped: boolean };
  proposed: { iqama: string; clamped: boolean };
}

export interface IqamaConflict {
  date: string;
  prayer: PrayerName;
  azan: string;
  sunrise: string;
  iqama: string;
  broken?: boolean;
}

export interface IqamaPreviewResponse {
  previewId: string;
  currentRevision: number;
  effectiveFrom: string;
  warnings: { path?: string; message: string }[];
  /** Days where Fajr clashes with the sunrise guardrail (absent on older engines). */
  conflicts?: IqamaConflict[];
  days: { date: string; day_of_week: string; prayers: Record<PrayerName, PreviewDayPrayer> }[];
  summary: {
    from: string;
    to: string;
    totalDays: number;
    daysChanged: number;
    daysClamped: number;
    daysClampedCurrent: number;
    firstChangedDates: string[];
    firstClampedDates: string[];
    byPrayer: Record<PrayerName, { daysChanged: number; daysClamped: number }>;
  };
}
