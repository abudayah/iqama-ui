// Feature: prayer-app, Property 7: Admin requests always include the x-api-key header
import { describe, it, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { apiFetch } from './api-client';
import { CONFIG_KEYS } from '../types/index';

/**
 * Validates: Requirements 7.4
 */
describe('Property 7: Admin requests always include the x-api-key header', () => {
  beforeEach(() => {
    localStorage.setItem(CONFIG_KEYS.BASE_URL, 'https://api.example.com');
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('should include x-api-key header equal to stored key for any API key', async () => {
    // HTTP header values are normalized by trimming leading/trailing whitespace (per Fetch spec).
    // We constrain the generator to strings that survive this normalization unchanged,
    // i.e. strings with no leading/trailing whitespace and at least one non-whitespace character.
    const validApiKey = fc
      .string({ minLength: 1 })
      .filter((s) => s.trim() === s && s.trim().length > 0);

    await fc.assert(
      fc.asyncProperty(
        validApiKey,
        async (apiKey) => {
          localStorage.setItem(CONFIG_KEYS.API_KEY, apiKey);

          let capturedHeaders: Headers | undefined;
          vi.stubGlobal('fetch', vi.fn().mockImplementation((_url: string, init?: RequestInit) => {
            capturedHeaders = new Headers(init?.headers);
            return Promise.resolve({
              status: 200,
              ok: true,
              headers: new Headers(),
              json: async () => ({}),
            } as Response);
          }));

          await apiFetch('/api/v1/admin/overrides', { requiresAuth: true });

          return capturedHeaders?.get('x-api-key') === apiKey;
        }
      ),
      { numRuns: 100 }
    );
  });
});
