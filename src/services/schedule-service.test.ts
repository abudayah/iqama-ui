/**
 * Integration tests for schedule-service using MSW v2 to mock the API.
 * Validates: Requirements 2.3, 2.4
 */
import { describe, it, expect, beforeAll, afterEach, afterAll, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { fetchScheduleForDate, fetchScheduleForRange } from './schedule-service';
import { DailySchedule } from '../types/index';
import { CONFIG_KEYS } from '../types/index';

const BASE_URL = 'https://api.example.com';

const fixtureSchedule: DailySchedule = {
  date: '2025-01-15',
  hijri_date: 'Rajab 15, 1446',
  day_of_week: 'Wednesday',
  is_dst: false,
  fajr: { azan: '05:30', iqama: '05:45' },
  sunrise: '07:00',
  dhuhr: { azan: '12:15', iqama: '12:30' },
  asr: { azan: '15:30', iqama: '15:45' },
  maghrib: { azan: '17:45', iqama: '17:50' },
  isha: { azan: '19:15', iqama: '19:30' },
  metadata: { calculation_method: 'ISNA', has_overrides: false },
};

const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

beforeEach(() => {
  localStorage.setItem(CONFIG_KEYS.BASE_URL, BASE_URL);
});

describe('fetchScheduleForDate', () => {
  it('returns a parsed DailySchedule on success', async () => {
    server.use(
      http.get(`${BASE_URL}/api/v1/schedule`, () => {
        return HttpResponse.json(fixtureSchedule);
      }),
    );

    const result = await fetchScheduleForDate('2025-01-15');

    expect(result).toEqual(fixtureSchedule);
  });

  it('throws an error on non-2xx response (500)', async () => {
    server.use(
      http.get(`${BASE_URL}/api/v1/schedule`, () => {
        return HttpResponse.json({ message: 'Internal Server Error' }, { status: 500 });
      }),
    );

    await expect(fetchScheduleForDate('2025-01-15')).rejects.toThrow('Internal Server Error');
  });
});

describe('fetchScheduleForRange', () => {
  it('returns an array of DailySchedule objects on success', async () => {
    const fixtureSchedule2: DailySchedule = {
      ...fixtureSchedule,
      date: '2025-01-16',
      day_of_week: 'Thursday',
    };

    server.use(
      http.get(`${BASE_URL}/api/v1/schedule`, () => {
        return HttpResponse.json([fixtureSchedule, fixtureSchedule2]);
      }),
    );

    const result = await fetchScheduleForRange('2025-01-15', '2025-01-16');

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual(fixtureSchedule);
    expect(result[1]).toEqual(fixtureSchedule2);
  });

  it('throws an error on non-2xx response (500)', async () => {
    server.use(
      http.get(`${BASE_URL}/api/v1/schedule`, () => {
        return HttpResponse.json({ message: 'Internal Server Error' }, { status: 500 });
      }),
    );

    await expect(fetchScheduleForRange('2025-01-15', '2025-01-16')).rejects.toThrow(
      'Internal Server Error',
    );
  });
});
