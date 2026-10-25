export type PrayerName = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

export interface PrayerEntry {
  azan: string; // HH:mm
  iqama: string; // HH:mm
}

export interface DailySchedule {
  date: string; // YYYY-MM-DD
  hijri_date: string; // e.g. "Dhul Hijjah 25, 1446"
  day_of_week: string; // e.g. "Friday"
  is_dst: boolean;
  fajr: PrayerEntry;
  sunrise: string; // HH:mm
  dhuhr: PrayerEntry;
  asr: PrayerEntry;
  maghrib: PrayerEntry;
  isha: PrayerEntry;
  /** Eid prayer times — present only on Eid days */
  eid_prayer_1?: string; // HH:mm — 1st Eid prayer
  eid_prayer_2?: string; // HH:mm — 2nd Eid prayer
  /** Qiyam al-Layl start time — present only on Hijri days 20–29 of month 9 */
  qiyam_time?: string; // HH:mm
  metadata: {
    calculation_method: string; // e.g. 'NorthAmerica', 'MuslimWorldLeague', etc.
    has_overrides: boolean;
  };
}

export interface Override {
  id: number;
  prayer: PrayerName;
  overrideType: 'FIXED' | 'OFFSET';
  value: string; // HH:mm for FIXED, signed integer string for OFFSET
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
}

// Payload used when creating or updating an override (id excluded)
export type OverridePayload = Omit<Override, 'id'>;

export interface AppConfig {
  baseUrl: string;
  apiKey: string;
}

export const CONFIG_KEYS = {
  BASE_URL: 'iqama_ui_base_url',
  API_KEY: 'iqama_ui_api_key',
} as const;

export type CountdownPhase = 'to_azan' | 'to_iqama' | 'done';

export interface CountdownState {
  phase: CountdownPhase;
  display: string; // e.g. "14:32" or "All prayers complete"
}

export type EidType = 'EID_AL_FITR' | 'EID_AL_ADHA';

export interface HijriCalendarStatus {
  gregorianDate: string; // YYYY-MM-DD
  hijriYear: number;
  hijriMonth: number;
  hijriDay: number;
  hasOverride: boolean;
  overrideLength: 29 | 30 | null;
}

export interface EidPrayerEntry {
  label: string;
  time: string; // HH:mm
}

export interface EidConfig {
  type: EidType;
  date: string; // YYYY-MM-DD
  prayers: EidPrayerEntry[];
}

export interface SubmitOverridePayload {
  hijriYear: number;
  hijriMonth: number;
  length: 29 | 30;
  eidConfig?: EidConfig;
}

export interface EidPrayerRecord {
  type: EidType; // 'EID_AL_FITR' | 'EID_AL_ADHA'
  date: string; // YYYY-MM-DD
  prayers: EidPrayerEntry[];
  source: 'override' | 'astronomical';
}

// ─── Adhan Configuration ──────────────────────────────────────────────────────

export type CalculationMethodName =
  | 'MuslimWorldLeague'
  | 'Egyptian'
  | 'Karachi'
  | 'UmmAlQura'
  | 'Dubai'
  | 'MoonsightingCommittee'
  | 'NorthAmerica'
  | 'Kuwait'
  | 'Qatar'
  | 'Singapore'
  | 'Tehran'
  | 'Turkey'
  | 'Other';

export type MadhabName = 'shafi' | 'hanafi';
export type HighLatitudeRuleName = 'MiddleOfTheNight' | 'SeventhOfTheNight' | 'TwilightAngle';
export type RoundingName = 'Nearest' | 'Up' | 'None';
export type ShafaqName = 'General' | 'Ahmer' | 'Abyad';
export type PolarCircleResolutionName = 'Unresolved' | 'AqrabBalad' | 'AqrabYaum';
export type PrayerKey = 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

export interface GeneralSettings {
  method: CalculationMethodName;
  madhab: MadhabName;
  highLatitudeRule: HighLatitudeRuleName;
  polarCircleResolution: PolarCircleResolutionName;
  rounding: RoundingName;
  shafaq?: ShafaqName;
}

export interface PrayerSettings {
  method?: CalculationMethodName;
  fajrAngle?: number;
  ishaAngle?: number;
  ishaInterval?: number;
  maghribAngle?: number;
  offsetMinutes?: number;
}

export interface AdhanSettings {
  general: GeneralSettings;
  prayers: Partial<Record<PrayerKey, PrayerSettings>>;
}

export interface PartialAdhanSettings {
  general?: Partial<GeneralSettings>;
  prayers?: Partial<Record<PrayerKey, PrayerSettings>>;
}

export interface AdhanConfigVersion {
  id: number;
  effectiveFrom: string; // YYYY-MM-DD
  settings: string; // JSON
  reason: string | null;
  createdBy: string;
  createdAt: string;
}

export interface AdhanConfigPeriod {
  id: number;
  label: string;
  startDate: string;
  endDate: string;
  settings: string; // JSON
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface AdhanConfigAuditEntry {
  id: number;
  entity: 'VERSION' | 'PERIOD';
  entityId: number;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'REVERT';
  before: string | null;
  after: string | null;
  actor: string;
  reason: string | null;
  createdAt: string;
}

export interface MethodCatalogEntry {
  name: CalculationMethodName;
  label: string;
  description: string;
  fajrAngle: number;
  ishaAngle: number | null;
  ishaInterval: number | null;
  maghribAngle: number | null;
  methodAdjustments: {
    fajr: number;
    sunrise: number;
    dhuhr: number;
    asr: number;
    maghrib: number;
    isha: number;
  };
  supportsShafaq: boolean;
}

export interface AdhanCatalogResponse {
  methods: MethodCatalogEntry[];
  madhabValues: MadhabName[];
  highLatitudeRuleValues: HighLatitudeRuleName[];
  roundingValues: RoundingName[];
  shafaqValues: ShafaqName[];
  polarCircleResolutionValues: PolarCircleResolutionName[];
  recommendedHighLatitudeRule: HighLatitudeRuleName;
}

export interface AdhanConfigResponse {
  currentRevision: number;
  versions: AdhanConfigVersion[];
  periods: AdhanConfigPeriod[];
  effective: {
    date: string;
    general: GeneralSettings;
    perPrayer: Record<PrayerKey, { offsetMinutes: number; method: CalculationMethodName }>;
    baseVersionId: number;
    activePeriodIds: number[];
  } | null;
  recommendedHighLatitudeRule: HighLatitudeRuleName;
  /** Server-computed today in masjid timezone (YYYY-MM-DD) */
  today: string;
  /** IANA timezone of the masjid */
  timezone: string;
}

export interface PreviewResponse {
  previewId: string;
  currentRevision: number;
  warnings: Array<{ field: string; message: string; severity: 'warning' }>;
}
