export type PrayerName = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

export interface PrayerEntry {
  azan: string;   // HH:mm
  iqama: string;  // HH:mm
}

export interface DailySchedule {
  date: string;         // YYYY-MM-DD
  hijri_date: string;   // e.g. "Dhul Hijjah 25, 1446"
  day_of_week: string;  // e.g. "Friday"
  is_dst: boolean;
  fajr: PrayerEntry;
  sunrise: string;      // HH:mm
  dhuhr: PrayerEntry;
  asr: PrayerEntry;
  maghrib: PrayerEntry;
  isha: PrayerEntry;
  metadata: {
    calculation_method: 'ISNA';
    has_overrides: boolean;
  };
}

export interface Override {
  id: number;
  prayer: PrayerName;
  overrideType: 'FIXED' | 'OFFSET';
  value: string;      // HH:mm for FIXED, signed integer string for OFFSET
  startDate: string;  // YYYY-MM-DD
  endDate: string;    // YYYY-MM-DD
}

// Payload used when creating or updating an override (id excluded)
export type OverridePayload = Omit<Override, 'id'>;

export interface AppConfig {
  baseUrl: string;
  apiKey: string;
}

export const CONFIG_KEYS = {
  BASE_URL: 'iqama_ui_base_url',
  API_KEY:  'iqama_ui_api_key',
} as const;

export type CountdownPhase = 'to_azan' | 'to_iqama' | 'done';

export interface CountdownState {
  phase: CountdownPhase;
  display: string;   // e.g. "14:32" or "All prayers complete"
}
