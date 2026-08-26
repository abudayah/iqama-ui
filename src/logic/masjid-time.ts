/**
 * Masjid timezone utilities.
 *
 * Prayer time strings from the backend are in the masjid's configured timezone
 * (MASJID_TIMEZONE on the engine side).  When we need a JS Date that represents
 * "HH:mm on a given date *in the masjid's timezone*", we cannot simply use
 * `new Date(year, month, day, h, m)` — that constructor always uses the
 * browser's local timezone, which may differ by hours.
 *
 * The fix uses `Intl.DateTimeFormat` to find the UTC offset for the target
 * timezone at the specific instant, then builds a UTC-anchored Date that, when
 * interpreted in that timezone, yields the requested wall-clock time.
 */

/** The IANA timezone string configured for the masjid (e.g. "America/Vancouver"). */
export const MASJID_TIMEZONE: string = import.meta.env['VITE_MASJID_TIMEZONE'] ?? 'UTC';

/**
 * Returns a Date whose wall-clock time in `MASJID_TIMEZONE` matches the
 * given `YYYY-MM-DD` date and `HH:mm` time string.
 *
 * This is equivalent to `dayjs.tz(date + ' ' + time, MASJID_TIMEZONE).toDate()`
 * but without requiring dayjs-timezone in the UI bundle.
 */
export function parseMasjidTime(date: string, time: string): Date {
  const [year, month, day] = date.split('-').map(Number) as [number, number, number];
  const [hours, minutes] = time.split(':').map(Number) as [number, number];

  // Step 1: make a naive UTC candidate as if the timezone offset were 0.
  const naiveUtcMs = Date.UTC(year, month - 1, day, hours, minutes, 0, 0);

  // Step 2: ask the runtime what UTC offset applies for that instant in the
  // masjid's timezone.  We do this by formatting the naive UTC timestamp using
  // the target timezone and comparing it with the requested wall-clock time.
  // One iteration is almost always sufficient; DST transitions near midnight
  // are handled by the correction loop.
  let candidate = naiveUtcMs;
  for (let attempt = 0; attempt < 3; attempt++) {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: MASJID_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(new Date(candidate));

    const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? '0');

    const tzYear = get('year');
    const tzMonth = get('month');
    const tzDay = get('day');
    // hour12: false gives "24" for midnight in some runtimes — normalise it.
    const tzHour = get('hour') % 24;
    const tzMinute = get('minute');

    // If the formatted output already matches our target, candidate is correct — stop now
    // before recomputing, otherwise the diff calculation would corrupt it.
    if (
      tzYear === year &&
      tzMonth === month &&
      tzDay === day &&
      tzHour === hours &&
      tzMinute === minutes
    ) {
      break;
    }

    const tzMs = Date.UTC(tzYear, tzMonth - 1, tzDay, tzHour, tzMinute, 0, 0);
    const diff = naiveUtcMs - tzMs; // offset in ms between UTC and tz wall-clock
    candidate = naiveUtcMs + diff;
  }

  return new Date(candidate);
}
