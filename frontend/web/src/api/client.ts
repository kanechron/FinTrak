const BASE = '/api'

interface ErrorResponseDto {
  fields: Record<string, string[]> | null
  message: string
  code: string | null
}

/**
 * Error thrown by {@link request} — and therefore every `api.*` call — when the server responds with a non-2xx status.
 * @remarks `code` and `fields` are only populated when the server's response body matches the `ErrorResponseDto` shape; a network failure or a non-JSON error body (e.g. a raw 502 from the proxy) falls back to `code: null, fields: null` with just a message.
 */
export class ApiError extends Error {
  code: string | null
  fields: Record<string, string[]> | null

  constructor(
    message: string,
    code: string | null = null,
    fields: Record<string, string[]> | null = null
  ) {
    super(message)
    this.code = code
    this.fields = fields
  }
}

/**
 * Shared fetch wrapper used by every method on {@link api}. Not exported directly —
 * always called through `api.get`/`api.post`/`api.patch`/`api.delete`.
 * @remarks A 401 response redirects to `/login` immediately instead of throwing. An
 * empty response body resolves to `undefined` rather than throwing a JSON-parse error.
 * @param path - request path, appended to the `/api` base
 * @param options - standard `RequestInit`, merged with credentials and JSON headers
 * @throws {ApiError} if the response is not ok (401 redirects instead of throwing)
 */
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })

  if (res.status === 401) {
    window.location.href = '/login'
    return undefined as T
  }

  if (!res.ok) {
    const text = await res.text()
    // Not every failure body is our ErrorResponseDto shape (e.g. a raw 502 from the
    // proxy) — fall back to the plain text/status if it isn't parseable JSON.
    try {
      const dto: ErrorResponseDto = JSON.parse(text)
      throw new ApiError(dto.message ?? res.statusText, dto.code ?? null, dto.fields ?? null)
    } catch (err) {
      if (err instanceof ApiError) throw err
      throw new ApiError(text || res.statusText)
    }
  }

  const text = await res.text()
  return text ? JSON.parse(text) : (undefined as T)
}

/**
 * Shared HTTP client for all backend requests. Every method resolves with the parsed
 * JSON response, or rejects with an {@link ApiError}.
 * @remarks All requests include credentials (cookies) and default to a JSON `Content-Type` header.
 */
export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}
