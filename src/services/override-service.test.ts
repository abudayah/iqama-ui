/**
 * Integration tests for override-service using MSW v2 to mock the API.
 * Validates: Requirements 8.1, 9.4, 10.3, 11.3
 */
import { describe, it, expect, beforeAll, afterEach, afterAll, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { fetchOverrides, createOverride, updateOverride, deleteOverride } from './override-service';
import { Override } from '../types/index';
import { CONFIG_KEYS } from '../types/index';
import { AuthError } from '../api/errors';

const BASE_URL = 'https://api.example.com';
const API_KEY = 'test-api-key';

const fixtureOverride: Override = {
  id: 1,
  prayer: 'fajr',
  overrideType: 'FIXED',
  value: '05:45',
  startDate: '2025-01-01',
  endDate: '2025-01-31',
};

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

describe('fetchOverrides', () => {
  it('returns an array of overrides on success', async () => {
    server.use(
      http.get(`${BASE_URL}/api/v1/admin/overrides`, () => {
        return HttpResponse.json([fixtureOverride]);
      }),
    );

    const result = await fetchOverrides();

    expect(result).toEqual([fixtureOverride]);
  });

  it('throws AuthError on 401 response', async () => {
    server.use(
      http.get(`${BASE_URL}/api/v1/admin/overrides`, () => {
        return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
      }),
    );

    await expect(fetchOverrides()).rejects.toSatisfy((err: unknown) => {
      return err instanceof AuthError && err.status === 401;
    });
  });
});

describe('createOverride', () => {
  it('sends POST and returns the created override', async () => {
    const { id: _id, ...payload } = fixtureOverride;

    server.use(
      http.post(`${BASE_URL}/api/v1/admin/overrides`, () => {
        return HttpResponse.json(fixtureOverride, { status: 201 });
      }),
    );

    const result = await createOverride(payload);

    expect(result).toEqual(fixtureOverride);
  });

  it('throws AuthError on 401 response', async () => {
    const { id: _id, ...payload } = fixtureOverride;

    server.use(
      http.post(`${BASE_URL}/api/v1/admin/overrides`, () => {
        return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
      }),
    );

    await expect(createOverride(payload)).rejects.toSatisfy((err: unknown) => {
      return err instanceof AuthError && err.status === 401;
    });
  });
});

describe('updateOverride', () => {
  it('sends PATCH and returns the updated override', async () => {
    const updatedOverride: Override = { ...fixtureOverride, value: '06:00' };

    server.use(
      http.patch(`${BASE_URL}/api/v1/admin/overrides/${fixtureOverride.id}`, () => {
        return HttpResponse.json(updatedOverride);
      }),
    );

    const result = await updateOverride(fixtureOverride.id, { value: '06:00' });

    expect(result).toEqual(updatedOverride);
  });

  it('throws AuthError on 401 response', async () => {
    server.use(
      http.patch(`${BASE_URL}/api/v1/admin/overrides/${fixtureOverride.id}`, () => {
        return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
      }),
    );

    await expect(updateOverride(fixtureOverride.id, { value: '06:00' })).rejects.toSatisfy(
      (err: unknown) => {
        return err instanceof AuthError && err.status === 401;
      },
    );
  });
});

describe('deleteOverride', () => {
  it('resolves without error on 204 response', async () => {
    server.use(
      http.delete(`${BASE_URL}/api/v1/admin/overrides/${fixtureOverride.id}`, () => {
        return new HttpResponse(null, { status: 204 });
      }),
    );

    await expect(deleteOverride(fixtureOverride.id)).resolves.toBeUndefined();
  });

  it('throws AuthError on 401 response', async () => {
    server.use(
      http.delete(`${BASE_URL}/api/v1/admin/overrides/${fixtureOverride.id}`, () => {
        return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
      }),
    );

    await expect(deleteOverride(fixtureOverride.id)).rejects.toSatisfy((err: unknown) => {
      return err instanceof AuthError && err.status === 401;
    });
  });
});
