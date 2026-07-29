const BASE = '/api'

interface ErrorResponseDto {
  fields: Record<string, string[]> | null
  message: string
  code: string | null
}

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

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}
