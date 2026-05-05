/**
 * Unit tests for hijri-calendar-service using MSW v2 to mock the API.
 * Validates: Requirements 8.1, 8.2, 8.3
 */
import { describe, it, expect, beforeAll, afterEach, afterAll, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { fetchQiyamConfig, saveQiyamConfig } from './hijri-calendar-service';
import { CONFIG_KEYS } from '../types/index';

const BASE_URL = 'https://api.example.com';
const API_KEY = 'test-api-key';

const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

beforeEach(() => {
  localStorage.setItem(CONFIG_KEYS.BASE_URL, BASE_URL);
  localStorage.setItem(CONFIG_KEYS.API_KEY, API_KEY);
});

afterEach(() => {
  localStorage.clear();
});

describe('fetchQiyamConfig', () => {
  it('calls GET /api/v1/hijri-calendar/qiyam-config without auth header', async () => {
    let capturedRequest: Request | undefined;

    server.use(
      http.get(`${BASE_URL}/api/v1/hijri-calendar/qiyam-config`, ({ request }) => {
        capturedRequest = request;
        return HttpResponse.json({ hijri_year: 1446, start_time: '02:00' });
      }),
    );

    await fetchQiyamConfig();

    expect(capturedRequest).toBeDefined();
    expect(capturedRequest!.headers.get('x-api-key')).toBeNull();
  });

  it('returns the config object when the server returns one', async () => {
    const fixture = { hijri_year: 1446, start_time: '02:00' };

    server.use(
      http.get(`${BASE_URL}/api/v1/hijri-calendar/qiyam-config`, () => {
        return HttpResponse.json(fixture);
      }),
    );

    const result = await fetchQiyamConfig();

    expect(result).toEqual(fixture);
  });

  it('returns null when the server returns null', async () => {
    server.use(
      http.get(`${BASE_URL}/api/v1/hijri-calendar/qiyam-config`, () => {
        return HttpResponse.json(null);
      }),
    );

    const result = await fetchQiyamConfig();

    expect(result).toBeNull();
  });

  it('throws on non-2xx response', async () => {
    server.use(
      http.get(`${BASE_URL}/api/v1/hijri-calendar/qiyam-config`, () => {
        return HttpResponse.json({ message: 'Internal Server Error' }, { status: 500 });
      }),
    );

    await expect(fetchQiyamConfig()).rejects.toThrow();
  });
});

describe('saveQiyamConfig', () => {
  it('calls POST /api/v1/hijri-calendar/qiyam-config with auth header and correct body', async () => {
    let capturedRequest: Request | undefined;
    let capturedBody: unknown;

    server.use(
      http.post(`${BASE_URL}/api/v1/hijri-calendar/qiyam-config`, async ({ request }) => {
        capturedRequest = request;
        capturedBody = await request.json();
        return new HttpResponse(null, { status: 204 });
      }),
    );

    await saveQiyamConfig('02:30');

    expect(capturedRequest).toBeDefined();
    expect(capturedRequest!.headers.get('x-api-key')).toBe(API_KEY);
    expect(capturedBody).toEqual({ start_time: '02:30' });
  });

  it('throws on non-2xx response', async () => {
    server.use(
      http.post(`${BASE_URL}/api/v1/hijri-calendar/qiyam-config`, () => {
        return HttpResponse.json({ message: 'Forbidden' }, { status: 403 });
      }),
    );

    await expect(saveQiyamConfig('02:30')).rejects.toThrow();
  });
});
