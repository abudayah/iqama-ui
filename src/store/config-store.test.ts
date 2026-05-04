import { describe, it, expect, beforeEach } from 'vitest';
import { getConfig, setBaseUrl, setApiKey, clearApiKey } from './config-store';

describe('config-store', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // Requirement 1.1 – default state
  describe('getConfig()', () => {
    it('returns empty strings when localStorage is empty', () => {
      const config = getConfig();
      expect(config.baseUrl).toBe('');
      expect(config.apiKey).toBe('');
    });
  });

  // Requirement 1.2 – base URL persistence
  describe('setBaseUrl()', () => {
    it('saves a valid https URL and getConfig() returns it', () => {
      setBaseUrl('https://api.example.com');
      expect(getConfig().baseUrl).toBe('https://api.example.com');
    });

    it('saves a valid http URL and getConfig() returns it', () => {
      setBaseUrl('http://localhost:3000');
      expect(getConfig().baseUrl).toBe('http://localhost:3000');
    });

    it('throws an Error for an empty string', () => {
      expect(() => setBaseUrl('')).toThrow(Error);
    });

    it('throws an Error for a plain string without a scheme', () => {
      expect(() => setBaseUrl('not-a-url')).toThrow(Error);
    });

    it('throws an Error for an ftp:// URL', () => {
      expect(() => setBaseUrl('ftp://files.example.com')).toThrow(Error);
    });
  });

  // Requirement 1.3 – API key persistence
  describe('setApiKey()', () => {
    it('saves a key and getConfig() returns it', () => {
      setApiKey('my-secret-key');
      expect(getConfig().apiKey).toBe('my-secret-key');
    });
  });

  describe('clearApiKey()', () => {
    it('clears the API key so getConfig() returns an empty string', () => {
      setApiKey('my-secret-key');
      clearApiKey();
      expect(getConfig().apiKey).toBe('');
    });
  });
});
