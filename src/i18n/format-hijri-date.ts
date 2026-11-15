import i18n from './index';

const MONTH_KEYS: Record<string, string> = {
  Muharram: 'hijriMonths.muharram',
  Safar: 'hijriMonths.safar',
  'Rabi al-Awwal': 'hijriMonths.rabiAlAwwal',
  'Rabi al-Thani': 'hijriMonths.rabiAlThani',
  'Jumada al-Awwal': 'hijriMonths.jumadaAlAwwal',
  'Jumada al-Thani': 'hijriMonths.jumadaAlThani',
  Rajab: 'hijriMonths.rajab',
  "Sha'ban": 'hijriMonths.shaban',
  Ramadan: 'hijriMonths.ramadan',
  Shawwal: 'hijriMonths.shawwal',
  "Dhul Qi'dah": 'hijriMonths.dhulQidah',
  'Dhul Hijjah': 'hijriMonths.dhulHijjah',
};

/** Localize the engine-provided Hijri date without recalculating its value. */
export function formatHijriDate(value: string, language: string): string {
  if (!language.startsWith('ar')) return value;

  const match = /^(.*?)\s+(\d{1,2}),?\s+(\d{3,4})$/.exec(value.trim());
  if (!match) return value;

  const [, month, day, year] = match;
  const key = MONTH_KEYS[month!];
  if (!key) return value;

  return `${day} ${i18n.t(key, { lng: language })} ${year}`;
}
