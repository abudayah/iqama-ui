/**
 * Types for the /api/v1/admin/iqama-rules contract (mirrors the engine).
 * Source of truth: iqama-engine `.kiro/steering/iqama-rules-system.md`, section
 * "UI contract (exact shapes)".
 */
import type { PrayerName } from './index';

export type Weekday = 'SUN' | 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT';
export const WEEKDAYS: readonly Weekday[] = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

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

// ── GET / ────────────────────────────────────────────────────────────────────

/** One stored version, as described by GET / (`effective`, `latest`, `upcoming[]`). */
export interface IqamaVersion {
  versionId: number;
  effectiveFrom: string;
  createdAt: string;
  reason: string | null;
  /** Null only if the stored JSON fails validation (then `error` is set). */
  rules: RuleSet | null;
  error: string | null;
}

/** A row of `versions[]` (history; `settings` is a JSON string). */
export interface IqamaRuleVersion {
  id: number;
  effectiveFrom: string;
  settings: string;
  createdBy: string;
  createdAt: string;
  reason?: string | null;
}

export interface IqamaRulesConfig {
  mode: 'legacy' | 'shadow' | 'db';
  cutover: string;
  currentRevision: number;
  today: string;
  timezone: string;
  defaultEffectiveFrom: string;
  /** In force today; null before the cutover or when there is no version. */
  effective: IqamaVersion | null;
  /** The newest version: the baseline every new version is built on. */
  latest: IqamaVersion | null;
  /** Versions with effectiveFrom after today, oldest first. */
  upcoming: IqamaVersion[];
  versions: IqamaRuleVersion[];
}

// ── GET /catalog ─────────────────────────────────────────────────────────────

export type FieldKind = 'int' | 'time' | 'enum' | 'list' | 'object' | 'bool';

export interface CatalogField {
  name: string;
  label: string;
  kind: FieldKind;
  required: boolean;
  /** Only these prayers may use the field. */
  prayers?: PrayerName[];
  /** Present only where a default is safe. */
  default?: unknown;
  note?: string;
  // int
  min?: number;
  max?: number;
  integer?: boolean;
  // time
  format?: string;
  // enum
  options?: { value: string | number; label: string }[];
  // list: `item` holds the fields of one item
  minItems?: number;
  maxItems?: number;
  item?: CatalogField[];
  // object: plain `fields`, or a discriminated union
  fields?: CatalogField[];
  discriminator?: string;
  variants?: { value: string; label: string; fields: CatalogField[] }[];
}

export interface IqamaCatalog {
  prayers: {
    name: PrayerName;
    weeklyLockAllowed: boolean;
    fridayStartRequired: boolean;
    sunriseLimitAllowed: boolean;
  }[];
  baseTypes: { type: RuleBase['type']; label: string; note?: string; fields: CatalogField[] }[];
  /** Optional parts of a prayer rule, in pipeline order. */
  modifiers: CatalogField[];
  pipeline?: string[];
  guardrails: {
    minGapAfterAzanMinutes: number;
    fajrEndsBeforeSunriseMinutes: number;
    /** Every iqama lands on a multiple of this. */
    iqamaStepMinutes?: number;
    fajrSunriseConflictPolicy?: string;
  };
}

// ── POST /preview ────────────────────────────────────────────────────────────

export interface IqamaConflict {
  date: string;
  prayer: PrayerName;
  azan: string;
  sunrise: string;
  iqama: string;
  brokenLimit?: string;
  wonBy?: string;
}

export interface PreviewDayPrayer {
  azan: string;
  current: { iqama: string; clamped: boolean };
  proposed: { iqama: string; clamped: boolean };
}

export interface IqamaPreviewResponse {
  previewId: string;
  effectiveFrom: string;
  currentRevision: number;
  /** SHA-256 of the canonical RuleSet and effectiveFrom. */
  requestHash: string;
  warnings: { path?: string; message: string }[];
  conflicts?: IqamaConflict[];
  days: { date: string; day_of_week: string; prayers: Record<PrayerName, PreviewDayPrayer> }[];
  summary: {
    from: string;
    to: string;
    totalDays: number;
    daysChanged: number;
    daysClamped: number;
    daysClampedCurrent: number;
    conflictDays?: number;
    /** Days newly moved by the safety rules because of this change (number, or per prayer). */
    newlyMoved?: number | Partial<Record<PrayerName, number>>;
    firstChangedDates: string[];
    firstClampedDates: string[];
    byPrayer: Record<
      PrayerName,
      { daysChanged: number; daysClamped: number; daysClampedCurrent?: number }
    >;
  };
}
