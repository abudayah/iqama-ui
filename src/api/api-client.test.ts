import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiFetch } from './api-client';
import { AuthError, ApiError, NetworkError, ParseError } from './errors';
import { CONFIG_KEYS } from '../types/index';

const BASE_URL = 'https://api.example.com';

/**
 * Helper to build a minimal Response-like object for vi.stubGlobal('fetch', ...).
 */
function makeResponse(
  status: number,
  body: string | null,
  contentType = 'application/json',
): Response {
  const headers = new Headers({ 'content-type': contentType });
  return {
    status,
    ok: status >= 200 && status < 300,
    headers,
    json: async () => {
      if (body === null) throw new SyntaxError('Unexpected end of JSON input');
      return JSON.parse(body);
    },
    text: async () => body ?? '',
  } as unknown as Response;
}

describe('apiFetch', () => {
  beforeEach(() => {
    // Provide a valid baseUrl in localStorage so getConfig() returns it.
    localStorage.setItem(CONFIG_KEYS.BASE_URL, BASE_URL);
    localStorage.setItem(CONFIG_KEYS.API_KEY, 'test-key');
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  // ── 1. HTTP 401 → AuthError ──────────────────────────────────────────────
  it('throws AuthError with status 401 on a 401 response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeResponse(401, null)));

    await expect(apiFetch('/test')).rejects.toSatisfy((err: unknown) => {
      return err instanceof AuthError && err.status === 401;
    });
  });

  // ── 2. HTTP 403 → AuthError ──────────────────────────────────────────────
  it('throws AuthError with status 403 on a 403 response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeResponse(403, null)));

    await expect(apiFetch('/test')).rejects.toSatisfy((err: unknown) => {
      return err instanceof AuthError && err.status === 403;
    });
  });

  // ── 3. HTTP 404 → ApiError ───────────────────────────────────────────────
  it('throws ApiError with status 404 on a 404 response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(makeResponse(404, JSON.stringify({ message: 'Not found' }))),
    );

    await expect(apiFetch('/test')).rejects.toSatisfy((err: unknown) => {
      return err instanceof ApiError && err.status === 404;
    });
  });

  // ── 4. HTTP 500 → ApiError ───────────────────────────────────────────────
  it('throws ApiError with status 500 on a 500 response', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(makeResponse(500, JSON.stringify({ message: 'Internal server error' }))),
    );

    await expect(apiFetch('/test')).rejects.toSatisfy((err: unknown) => {
      return err instanceof ApiError && err.status === 500;
    });
  });

  // ── 5. fetch throws (network failure) → NetworkError ────────────────────
  it('throws NetworkError when fetch itself throws (network failure)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    await expect(apiFetch('/test')).rejects.toBeInstanceOf(NetworkError);
  });

  // ── 6. Successful response with malformed JSON → ParseError ─────────────
  it('throws ParseError when a 200 response contains malformed JSON', async () => {
    const badJsonResponse: Response = {
      status: 200,
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => {
        throw new SyntaxError('Unexpected token');
      },
      text: async () => 'not-json',
    } as unknown as Response;

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(badJsonResponse));

    await expect(apiFetch('/test')).rejects.toBeInstanceOf(ParseError);
  });

  // ── 7. Successful response with valid JSON → returns parsed data ─────────
  it('returns parsed JSON data on a successful 200 response', async () => {
    const payload = { id: 1, name: 'Fajr' };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeResponse(200, JSON.stringify(payload))));

    const result = await apiFetch<typeof payload>('/test');
    expect(result).toEqual(payload);
  });

  // ── 8. HTTP 204 → returns undefined (no body parsing) ───────────────────
  it('returns undefined for a 204 No Content response without parsing the body', async () => {
    const noContentResponse: Response = {
      status: 204,
      ok: true,
      headers: new Headers(),
      json: vi.fn().mockRejectedValue(new SyntaxError('No body')),
      text: async () => '',
    } as unknown as Response;

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(noContentResponse));

    const result = await apiFetch('/test');
    expect(result).toBeUndefined();
    // json() must NOT have been called
    expect(noContentResponse.json).not.toHaveBeenCalled();
  });
});
