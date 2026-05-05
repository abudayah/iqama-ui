import { getConfig } from '../store/config-store';
import { NetworkError, AuthError, ApiError, ParseError } from './errors';

export async function apiFetch<T>(
  path: string,
  options?: RequestInit & { requiresAuth?: boolean }
): Promise<T> {
  const { baseUrl, apiKey } = getConfig();
  const { requiresAuth, ...fetchOptions } = options ?? {};

  const headers = new Headers(fetchOptions.headers);
  if (requiresAuth) {
    headers.set('x-api-key', apiKey);
  }

  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, { ...fetchOptions, headers });
  } catch (err) {
    throw new NetworkError('Network request failed', err);
  }

  if (response.status === 401 || response.status === 403) {
    throw new AuthError(response.status, `Authentication failed: ${response.status}`);
  }

  if (!response.ok) {
    let message = `API error: ${response.status}`;
    try {
      const body = await response.json() as { message?: string };
      if (body.message) message = body.message;
    } catch { /* ignore parse errors on error responses */ }
    throw new ApiError(response.status, message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  // Skip JSON parsing for responses with no content body
  const contentLength = response.headers.get('content-length');
  const contentType = response.headers.get('content-type');
  if (contentLength === '0' || !contentType || !contentType.includes('application/json')) {
    return undefined as T;
  }

  try {
    return await response.json() as T;
  } catch (err) {
    throw new ParseError('Failed to parse response JSON', err);
  }
}
