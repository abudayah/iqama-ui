export class NetworkError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class AuthError extends Error {
  constructor(
    public readonly status: 401 | 403,
    message: string,
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    /** Machine code from the response body, e.g. IQAMA_PREVIEW_INVALID. */
    public readonly code?: string,
    /** Field errors from a 400 response body: [{ path, message }]. */
    public readonly errors?: { path: string; message: string }[],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ParseError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'ParseError';
  }
}
