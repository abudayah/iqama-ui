// Feature: prayer-app, Property 3: Schedule URL construction is correct
import { describe, it, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { fetchScheduleForDate, fetchScheduleForRange } from './schedule-service';
import { CONFIG_KEYS } from '../types/index';

/**
 * Validates: Requirements 2.1, 2.2
 *
 * Property 3: Schedule URL construction is correct
 * For any valid base URL and YYYY-MM-DD date string, the URL produced by
 * fetchScheduleForDate equals {baseUrl}/api/v1/schedule?date={date}.
 * For any valid base URL, start date, and end date, the URL produced by
 * fetchScheduleForRange equals {baseUrl}/api/v1/schedule?start_date={start}&end_date={end}.
 */

const dateArb = fc
  .tuple(
    fc.integer({ min: 2020, max: 2030 }),
    fc.integer({ min: 1, max: 12 }),
    fc.integer({ min: 1, max: 28 }),
  )
  .map(([y, m, d]) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`);

describe('Property 3: Schedule URL construction is correct', () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('fetchScheduleForDate constructs the correct URL for any base URL and date', async () => {
    await fc.assert(
      fc.asyncProperty(fc.webUrl(), dateArb, async (baseUrl, date) => {
        localStorage.setItem(CONFIG_KEYS.BASE_URL, baseUrl);

        let capturedUrl: string | undefined;
        vi.stubGlobal(
          'fetch',
          vi.fn().mockImplementation((url: string) => {
            capturedUrl = url;
            return Promise.resolve({
              status: 200,
              ok: true,
              headers: new Headers(),
              json: async () => ({}),
            } as Response);
          }),
        );

        await fetchScheduleForDate(date);

        return capturedUrl === `${baseUrl}/api/v1/schedule?date=${date}`;
      }),
      { numRuns: 100 },
    );
  });

  it('fetchScheduleForRange constructs the correct URL for any base URL, start date, and end date', async () => {
    await fc.assert(
      fc.asyncProperty(fc.webUrl(), dateArb, dateArb, async (baseUrl, startDate, endDate) => {
        localStorage.setItem(CONFIG_KEYS.BASE_URL, baseUrl);

        let capturedUrl: string | undefined;
        vi.stubGlobal(
          'fetch',
          vi.fn().mockImplementation((url: string) => {
            capturedUrl = url;
            return Promise.resolve({
              status: 200,
              ok: true,
              headers: new Headers(),
              json: async () => ({}),
            } as Response);
          }),
        );

        await fetchScheduleForRange(startDate, endDate);

        return (
          capturedUrl === `${baseUrl}/api/v1/schedule?start_date=${startDate}&end_date=${endDate}`
        );
      }),
      { numRuns: 100 },
    );
  });
});
