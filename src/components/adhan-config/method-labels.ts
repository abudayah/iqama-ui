import type {
  CalculationMethodName,
  HighLatitudeRuleName,
  MadhabName,
  RoundingName,
  ShafaqName,
} from '../../types';

export const METHOD_LABELS: Record<CalculationMethodName, string> = {
  NorthAmerica: 'ISNA (North America)',
  MuslimWorldLeague: 'Muslim World League',
  Egyptian: 'Egyptian General Survey',
  Karachi: 'Karachi (Pakistan)',
  UmmAlQura: 'Umm al-Qura (Makkah)',
  Dubai: 'Dubai',
  MoonsightingCommittee: 'Moonsighting Committee',
  Kuwait: 'Kuwait',
  Qatar: 'Qatar',
  Singapore: 'Singapore (MUIS)',
  Tehran: 'Tehran',
  Turkey: 'Turkey (Diyanet)',
  Other: 'Custom',
};

export const HIGH_LAT_LABELS: Record<HighLatitudeRuleName, string> = {
  MiddleOfTheNight: 'Middle of the night',
  SeventhOfTheNight: 'Seventh of the night',
  TwilightAngle: 'Twilight angle',
};

export const MADHAB_LABELS: Record<MadhabName, string> = {
  shafi: "Shafi'i (earlier Asr)",
  hanafi: 'Hanafi (later Asr)',
};

export const ROUNDING_LABELS: Record<RoundingName, string> = {
  Nearest: 'Round to nearest minute',
  Up: 'Always round up',
  None: 'No rounding',
};

export const SHAFAQ_LABELS: Record<ShafaqName, string> = {
  General: 'General',
  Ahmer: 'Ahmer (red twilight)',
  Abyad: 'Abyad (white twilight)',
};
