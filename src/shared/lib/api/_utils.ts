import { NetworkError } from './types'
import type { ApiResponse, RequestConfig } from './types'
import { toast } from 'sonner'

/** endpoint + params → 완성된 URL 문자열 */
export function buildUrl(endpoint: string, params?: RequestConfig['params']): string {
  const base = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '')
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  const url = `${base}${path}`

  if (!params || Object.keys(params).length === 0) return url

  const searchParams = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    searchParams.set(key, String(value))
  }
  return `${url}?${searchParams.toString()}`
}

export function serializeBody(body: unknown): BodyInit | undefined {
  if (body === undefined) return undefined
  if (
    typeof body === 'string' ||
    body instanceof FormData ||
    body instanceof Blob ||
    body instanceof ArrayBuffer ||
    body instanceof URLSearchParams ||
    body instanceof ReadableStream
  ) {
    return body as BodyInit
  }
  return JSON.stringify(body)
}

/** 응답 body 파싱 — 204 또는 빈 body면 null 반환 */
export async function parseBody<T>(res: Response): Promise<T | null> {
  if (res.status === 204) return null

  const text = await res.text()
  if (!text.trim()) return null

  try {
    return JSON.parse(text) as T
  } catch {
    return null
  }
}

export const handleResponse = async <T>(
  res: Response,
  config?: RequestConfig,
): Promise<ApiResponse<T>> => {
  const body = await parseBody<ApiResponse<T>>(res)

  if (!body) throw new NetworkError()

  if (!body.success) {
    const error = {
      success: false,
      code: body.code,
      message: body.message,
      data: null,
      errors: body.errors ?? null,
    }
    throw error
  }

  return body
}
