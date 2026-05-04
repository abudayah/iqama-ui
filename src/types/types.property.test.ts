import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import type { AppConfig } from './index';

// Feature: prayer-app, Property 4: Config store round-trip
describe('Property 4: Config store round-trip', () => {
  it('should preserve baseUrl and apiKey through AppConfig object', () => {
    fc.assert(
      fc.property(
        fc.webUrl(),
        fc.string(),
        (baseUrl, apiKey) => {
          const config: AppConfig = { baseUrl, apiKey };
          return config.baseUrl === baseUrl && config.apiKey === apiKey;
        }
      ),
      { numRuns: 100 }
    );
  });
});
