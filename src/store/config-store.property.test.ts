// Feature: prayer-app, Property 6: Config store round-trip
import { describe, it, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { getConfig, setBaseUrl, setApiKey } from './config-store';

/**
 * Validates: Requirements 1.1, 1.2, 1.5
 *
 * Property 6: Config store round-trip
 * For any valid base URL string and API key string, writing them to the
 * Config_Store and then reading them back returns the same values.
 */
describe('Property 6: Config store round-trip', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should preserve baseUrl and apiKey through store write/read cycle', () => {
    fc.assert(
      fc.property(
        fc.webUrl(),
        fc.string(),
        (url, key) => {
          setBaseUrl(url);
          setApiKey(key);
          const config = getConfig();
          return config.baseUrl === url && config.apiKey === key;
        }
      ),
      { numRuns: 100 }
    );
  });
});
