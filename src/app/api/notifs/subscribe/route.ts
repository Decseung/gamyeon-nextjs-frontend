import { NextRequest, NextResponse } from 'next/server'
import { clearAuthTokenCookies, setAuthTokenCookies } from '@/shared/lib/auth/cookies'
import { reissue } from '@/shared/lib/auth/reissue'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

const SUBSCRIBE_PATH = '/api/v1/notifs/subscribe'
const SSE_EVENT_BOUNDARY = /\r\n\r\n|\n\n|\r\r/
const NO_STORE_HEADERS = {
  'Cache-Control': 'no-cache, no-store, no-transform',
  Vary: 'Cookie',
} as const

type RefreshedTokens = Extract<Awaited<ReturnType<typeof reissue>>, { ok: true }>

type RefreshResult =
  | { ok: true; tokens: RefreshedTokens }
  | { ok: false; reason: 'invalid' | 'network' }

function getSubscribeUrl(): URL | null {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/$/, '')
  if (!apiUrl) return null

  try {
    const url = new URL(`${apiUrl}${SUBSCRIBE_PATH}`)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    return url
  } catch {
    return null
  }
}

function errorResponse(status: number, code: string): NextResponse {
  return NextResponse.json(
    { success: false, code, data: null },
    { status, headers: NO_STORE_HEADERS },
  )
}

function clearAuthCookies(response: NextResponse): NextResponse {
  clearAuthTokenCookies(response.cookies)
  return response
}

function applyRefreshedCookies(
  response: NextResponse,
  refreshedTokens: RefreshedTokens | null,
): NextResponse {
  if (refreshedTokens) {
    setAuthTokenCookies(
      response.cookies,
      refreshedTokens.accessToken,
      refreshedTokens.refreshToken,
      refreshedTokens.expiresMap,
    )
  }

  return response
}

async function refreshAccessToken(request: NextRequest): Promise<RefreshResult> {
  const refreshToken = request.cookies.get('refreshToken')?.value
  if (!refreshToken) return { ok: false, reason: 'invalid' }

  const result = await reissue(refreshToken)
  if (!result.ok) return result

  return { ok: true, tokens: result }
}

function subscribe(
  url: URL,
  accessToken: string,
  signal: AbortSignal,
  lastEventId?: string,
): Promise<Response> {
  return fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'text/event-stream',
      Authorization: `Bearer ${accessToken}`,
      ...(lastEventId ? { 'Last-Event-ID': lastEventId } : {}),
    },
    cache: 'no-store',
    redirect: 'manual',
    signal,
  })
}

async function cancelBody(response: Response): Promise<void> {
  try {
    await response.body?.cancel()
  } catch {
    // The upstream may already have closed the response body.
  }
}

function invalidSessionResponse(): NextResponse {
  return clearAuthCookies(errorResponse(401, 'AUTH_SESSION_INVALID'))
}

function logSseEvent(frame: string): void {
  let event = 'message'
  const dataLines: string[] = []

  for (const line of frame.split(/\r\n|\n|\r/)) {
    if (line.startsWith('event:')) {
      event = line.slice('event:'.length).trimStart()
    } else if (line.startsWith('data:')) {
      dataLines.push(line.slice('data:'.length).trimStart())
    }
  }

  if (event === 'ping' || dataLines.length === 0) return

  const rawData = dataLines.join('\n')
  let data: unknown = rawData

  try {
    data = JSON.parse(rawData)
  } catch {
    // connect처럼 JSON이 아닌 SSE data는 문자열 그대로 확인한다.
  }

  console.info('[notif:sse:upstream]', { event, data })
}

function withDevelopmentLogging(body: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
  if (process.env.NODE_ENV === 'production') return body

  const decoder = new TextDecoder()
  let buffer = ''

  const logCompleteEvents = () => {
    let boundary = SSE_EVENT_BOUNDARY.exec(buffer)

    while (boundary) {
      const frame = buffer.slice(0, boundary.index)
      buffer = buffer.slice(boundary.index + boundary[0].length)
      if (frame) logSseEvent(frame)
      boundary = SSE_EVENT_BOUNDARY.exec(buffer)
    }
  }

  return body.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        buffer += decoder.decode(chunk, { stream: true })
        logCompleteEvents()
        controller.enqueue(chunk)
      },
      flush() {
        buffer += decoder.decode()
        logCompleteEvents()
        if (buffer) logSseEvent(buffer)
      },
    }),
  )
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const subscribeUrl = getSubscribeUrl()
  if (!subscribeUrl) {
    return errorResponse(503, 'NOTIF_SSE_UNAVAILABLE')
  }

  const lastEventId = request.headers.get('last-event-id') ?? undefined
  let accessToken = request.cookies.get('accessToken')?.value
  let refreshedTokens: RefreshedTokens | null = null

  if (!accessToken) {
    const refreshResult = await refreshAccessToken(request)
    if (!refreshResult.ok) {
      return refreshResult.reason === 'invalid'
        ? invalidSessionResponse()
        : errorResponse(503, 'AUTH_SERVICE_UNAVAILABLE')
    }

    refreshedTokens = refreshResult.tokens
    accessToken = refreshResult.tokens.accessToken
  }

  let upstreamResponse: Response
  try {
    upstreamResponse = await subscribe(subscribeUrl, accessToken, request.signal, lastEventId)
  } catch {
    return applyRefreshedCookies(errorResponse(503, 'NOTIF_SSE_UNAVAILABLE'), refreshedTokens)
  }

  if (upstreamResponse.status === 401) {
    await cancelBody(upstreamResponse)

    if (refreshedTokens) {
      return invalidSessionResponse()
    }

    const refreshResult = await refreshAccessToken(request)
    if (!refreshResult.ok) {
      return refreshResult.reason === 'invalid'
        ? invalidSessionResponse()
        : errorResponse(503, 'AUTH_SERVICE_UNAVAILABLE')
    }

    refreshedTokens = refreshResult.tokens

    try {
      upstreamResponse = await subscribe(
        subscribeUrl,
        refreshResult.tokens.accessToken,
        request.signal,
        lastEventId,
      )
    } catch {
      return applyRefreshedCookies(errorResponse(503, 'NOTIF_SSE_UNAVAILABLE'), refreshedTokens)
    }

    if (upstreamResponse.status === 401) {
      await cancelBody(upstreamResponse)
      return invalidSessionResponse()
    }
  }

  if (!upstreamResponse.ok) {
    const upstreamStatus = upstreamResponse.status
    const retryAfter = upstreamResponse.headers.get('retry-after')
    await cancelBody(upstreamResponse)

    const status = upstreamStatus >= 400 && upstreamStatus < 500 ? upstreamStatus : 502
    const response = errorResponse(status, 'NOTIF_SSE_UPSTREAM_ERROR')
    if (retryAfter && status === 429) response.headers.set('Retry-After', retryAfter)
    return applyRefreshedCookies(response, refreshedTokens)
  }

  const contentType = upstreamResponse.headers.get('content-type')?.toLowerCase()
  if (!upstreamResponse.body || !contentType?.startsWith('text/event-stream')) {
    await cancelBody(upstreamResponse)
    return applyRefreshedCookies(errorResponse(502, 'NOTIF_SSE_RESPONSE_INVALID'), refreshedTokens)
  }

  const response = new NextResponse(withDevelopmentLogging(upstreamResponse.body), {
    status: 200,
    headers: {
      ...NO_STORE_HEADERS,
      'Content-Type': contentType,
      'X-Accel-Buffering': 'no',
    },
  })

  return applyRefreshedCookies(response, refreshedTokens)
}
