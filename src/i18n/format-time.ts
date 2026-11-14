import i18n from './index';

/** Arabic day-period marks: AM → ص (ṣabāḥ), PM → م (masāʾ). */
const AR_DAY_PERIOD: Record<string, string> = { AM: 'ص', PM: 'م' };

/**
 * Format a 24-hour "HH:mm" time as a 12-hour clock in the active language:
 * English → "06:48 AM", Arabic → "06:48 ص".
 *
 * Digits always stay Western/Latin and left-to-right. Render the result inside
 * `<bdi dir="ltr">` so surrounding RTL text cannot re-order it.
 */
export function formatTime12(time24: string): string {
  const [hours, minutes] = time24.split(':');
  const date = new Date(2000, 0, 1, parseInt(hours ?? '0', 10), parseInt(minutes ?? '0', 10));
  const parts = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).formatToParts(date);
  const clock = parts
    .filter((p) => p.type === 'hour' || p.type === 'minute' || p.type === 'literal')
    .map((p) => p.value)
    .join('')
    .trim();
  const raw = parts.find((p) => p.type === 'dayPeriod')?.value ?? '';
  const period = i18n.language === 'ar' ? (AR_DAY_PERIOD[raw.toUpperCase()] ?? raw) : raw;
  return period ? `${clock} ${period}` : clock;
}
