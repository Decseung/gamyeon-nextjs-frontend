import { buildUrl, handleResponse, serializeBody } from './_utils'
import { ApiResponse, NetworkError } from './types'
import type { RequestConfig } from './types'
import { toast } from 'sonner'
import { useAuthStore } from '@/featured/auth/store'

// ─── 401 refresh 동시 요청 방지 ────────────────────────────────────────────────
// 1. "지금 새 입장권(토큰)을 받아오고 있는 중이야?" (처음엔 아니니까 false)
let isRefreshing = false
let pendingQueue: Array<(token: string | null) => void> = []

function waitForRefresh(): Promise<string | null> {
  return new Promise((resolve) => {
    // 4. Promise를 리턴하는데, resolve 함수 자체를 배열(Queue)에 밀어 넣습니다.
    //  원래는 여기서 햄버거 다 만들고 resolve()를 바로 눌러야 하는데,
    // 지금 누르지 않고 '진동벨 스위치(resolve)'를 선반(pendingQueue)에 쓱 밀어 넣어(push) 둡니다.
    // resolve"너가 원하는 작업이 성공적으로 끝났을 때 이 스위치를 눌러!"라는 뜻
    pendingQueue.push(resolve) //
  })
}

function resolveQueue(token: string | null) {
  pendingQueue.forEach((resolve) => resolve(token))
  pendingQueue = []
}

/** refresh 엔드포인트 단건 호출. 성공 시 새 accessToken 반환, 실패 시 null */
async function refreshOnce(): Promise<string | null> {
  const res = await fetch('/api/auth/refresh', { method: 'POST' })
  if (!res.ok) return null
  const data = await res.json()
  if (!data.success || !data.accessToken) return null
  return data.accessToken as string
}

/**
 * refresh 1회 시도.
 * 동시에 여러 요청이 401을 받아도 refresh는 1번만 실행됨.
 * 성공 시 새 accessToken 반환 및 Zustand store 갱신, 실패 시 null.
 */
async function attemptRefresh(): Promise<string | null> {
  if (isRefreshing) return waitForRefresh()

  isRefreshing = true
  try {
    const newToken = await refreshOnce()
    if (newToken) useAuthStore.getState().setAccessToken(newToken)
    resolveQueue(newToken)
    return newToken
  } catch {
    resolveQueue(null)
    return null
  } finally {
    isRefreshing = false
  }
}

function redirectToSignin() {
  if (typeof window !== 'undefined') {
    useAuthStore.getState().logout()
    window.location.replace('/api/auth/logout?redirectTo=/signin')
  }
}

// ─── 메인 fetcher ─────────────────────────────────────────────────────────────

/**
 * Authorization: Bearer 토큰을 자동으로 포함하는 클라이언트 전용 fetch 래퍼.
 *
 * 401 처리 흐름:
 *   원래 요청 → 401
 *     → refresh 시도 (동시 요청은 1회로 병합)
 *       ├── 성공 → 새 토큰으로 원래 요청 재시도
 *       └── 실패 → /signin redirect
 *
 */
export async function clientFetch<T>(
  endpoint: string,
  config?: RequestConfig & { method?: string; body?: BodyInit | null },
): Promise<ApiResponse<T>> {
  const url = buildUrl(endpoint, config?.params)

  const buildInit = (accessToken?: string | null): RequestInit => ({
    method: config?.method ?? 'GET',
    headers: {
      ...(typeof config?.body === 'string' && { 'Content-Type': 'application/json' }),
      ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      ...config?.headers,
    },
    body: config?.body,
    cache: config?.cache,
    next: config?.next,
  })

  const currentToken = useAuthStore.getState().accessToken

  // ── 원래 요청 ──
  let res: Response
  try {
    res = await fetch(url, buildInit(currentToken))
  } catch {
    const error = new NetworkError()
    if (!config?.silent) toast.error(error.message)
    throw error
  }

  if (res.status !== 401) {
    return await handleResponse<T>(res, config)
  }

  // ── 401 → refresh 시도 ──
  const newToken = await attemptRefresh()
  if (!newToken) {
    redirectToSignin()
    return {
      success: false,
      code: 'AUTH_EXPIRED',
      message: '인증 만료',
      data: null as T,
      errors: null,
    }
  }

  // ── refresh 성공 → 새 토큰으로 재시도 ──
  let retryRes: Response
  try {
    retryRes = await fetch(url, buildInit(newToken))
  } catch {
    const error = new NetworkError()
    if (!config?.silent) toast.error(error.message)
    throw error
  }
  return await handleResponse<T>(retryRes, config)
}

function requestWithoutBody<T>(
  method: string,
  endpoint: string,
  config?: RequestConfig,
): Promise<ApiResponse<T>> {
  return clientFetch<T>(endpoint, { ...config, method })
}

function requestWithBody<T>(
  method: string,
  endpoint: string,
  body?: unknown,
  config?: RequestConfig,
): Promise<ApiResponse<T>> {
  return clientFetch<T>(endpoint, { ...config, method, body: serializeBody(body) })
}

/**
 * 클라이언트 컴포넌트 전용 API 인터페이스.
 * 에러 발생 시 throw — 호출 측에서 try/catch 사용.
 *
 * @example
 * const data = await clientApi.get<User[]>('/users')
 * await clientApi.post('/login', { email, password })
 * await clientApi.get('/users', { silent: true })  // toast 비활성화
 */
export const clientApi = {
  get: <T>(endpoint: string, config?: RequestConfig) =>
    requestWithoutBody<T>('GET', endpoint, config),

  post: <T>(endpoint: string, body?: unknown, config?: RequestConfig) =>
    requestWithBody<T>('POST', endpoint, body, config),

  put: <T>(endpoint: string, body?: unknown, config?: RequestConfig) =>
    requestWithBody<T>('PUT', endpoint, body, config),

  patch: <T>(endpoint: string, body?: unknown, config?: RequestConfig) =>
    requestWithBody<T>('PATCH', endpoint, body, config),

  delete: <T>(endpoint: string, config?: RequestConfig) =>
    requestWithoutBody<T>('DELETE', endpoint, config),
}
