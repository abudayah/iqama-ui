import { AppConfig, CONFIG_KEYS } from '../types/index';

/**
 * Seed the base URL from the VITE_API_BASE_URL env variable if localStorage
 * doesn't already have a value. Called once at module load time so the
 * ConfigGate skips the setup screen when the env var is provided.
 */
const envBaseUrl = import.meta.env['VITE_API_BASE_URL'] as string | undefined;
if (envBaseUrl && !localStorage.getItem(CONFIG_KEYS.BASE_URL)) {
  try {
    const parsed = new URL(envBaseUrl);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      localStorage.setItem(CONFIG_KEYS.BASE_URL, envBaseUrl);
    }
  } catch {
    // Invalid env value — ignore and let the user configure manually
  }
}

/**
 * Reads the current app configuration from localStorage.
 * Returns empty strings for any missing values.
 */
export function getConfig(): AppConfig {
  return {
    baseUrl: localStorage.getItem(CONFIG_KEYS.BASE_URL) ?? '',
    apiKey: localStorage.getItem(CONFIG_KEYS.API_KEY) ?? '',
  };
}

/**
 * Validates and saves the API base URL to localStorage.
 * Throws an Error if the URL is not well-formed.
 */
export function setBaseUrl(url: string): void {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`Invalid base URL: "${url}". Please provide a well-formed URL (e.g. https://api.example.com).`);
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error(`Invalid base URL: "${url}". Only http and https schemes are supported.`);
  }
  localStorage.setItem(CONFIG_KEYS.BASE_URL, url);
}

/**
 * Saves the API key to localStorage.
 */
export function setApiKey(key: string): void {
  localStorage.setItem(CONFIG_KEYS.API_KEY, key);
}

/**
 * Removes the API key from localStorage (sets to empty string).
 */
export function clearApiKey(): void {
  localStorage.setItem(CONFIG_KEYS.API_KEY, '');
}
