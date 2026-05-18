import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { ApiResponse, NetworkError } from './types'
import type { RequestConfig } from './types'
import { buildUrl, handleResponse, serializeBody } from './_utils'
import { parseSetCookieExpires } from '@/shared/lib/utils/cookie'

/**
 * accessToken 재발급을 시도한다.
 * 성공 시 새 accessToken을 반환하고, 쿠키 저장을 시도한다.
 *
 * 쿠키 저장 가능 여부:
 * - Server Action 컨텍스트 → 저장 성공 (이후 요청에도 유효)
 * - RSC 컨텍스트 → 저장 불가 (throw를 catch해 무시). 새 토큰은 현재
 *   요청의 retry에만 사용된다. 다음 네비게이션에서 proxy가 refreshToken
 *   유효성을 재확인하고 serverFetch가 다시 refresh를 수행한다.
 *   ※ 백엔드가 refreshToken을 단일 사용(rotation) 방식으로 운용하는 경우
 *      RSC에서 새 refreshToken을 저장하지 못해 루프가 생길 수 있으므로,
 *      그 경우 백엔드 측 grace period 또는 아키텍처 재검토가 필요하다.
 *
 * @returns 새 accessToken 문자열, 실패 시 null
 */
async function tryRefresh(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
): Promise<string | null> {
  const refreshToken = cookieStore.get('refreshToken')?.value
  if (!refreshToken) return null

  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '')
  try {
    const res = await fetch(`${apiUrl}/api/v1/auth/reissue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })

    const data = await res.json()
    if (!data.success || !data.data?.accessToken) return null

    const newAccessToken: string = data.data.accessToken
    const isProd = process.env.NODE_ENV === 'production'
    const expiresMap = parseSetCookieExpires(res.headers.getSetCookie?.() ?? [])

    // RSC 컨텍스트에서는 throw되므로 try/catch로 감싼다.
    try {
      cookieStore.set('accessToken', newAccessToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        path: '/',
        expires: expiresMap.get('accessToken'),
      })
      if (data.data.refreshToken) {
        cookieStore.set('refreshToken', data.data.refreshToken, {
          httpOnly: true,
          secure: isProd,
          sameSite: 'lax',
          path: '/',
          expires: expiresMap.get('refreshToken'),
        })
      }
    } catch {
      // RSC 컨텍스트 — 쿠키 저장 불가, 현재 요청 retry에만 사용
    }

    return newAccessToken
  } catch {
    return null
  }
}

/**
 * 서버 전용 내부 fetcher.
 * next/headers로 쿠키를 읽어 Cookie 헤더에 직접 포함.
 *
 * 인증 흐름:
 * 1. 원래 요청 수행
 * 2. 401 수신 시 tryRefresh()로 accessToken 재발급 시도
 * 3. 재발급 성공 → 새 토큰으로 retry
 * 4. 재발급 실패 → /signin 리다이렉트
 *
 * ※ Server Action에서 try/catch로 serverApi를 감싸는 경우,
 *   redirect()가 throw하는 NEXT_REDIRECT를 반드시 re-throw해야 한다.
 *   예: catch (e) { if (isRedirectError(e)) throw e; ... }
 *
 * 에러 발생 시 throw — 호출 측에서 try/catch 사용.
 */

// 현재 프로젝트의 serverApi.ts 코드를 자세히 보면, serverFetch 함수가 결과를 반환할 때 이미 Promise<ApiResponse<T>> 형태로 감싸서 주고 있습니다.
// 즉, serverApi.get을 호출할 때는 실제 핵심 데이터(Notice[])만 제네릭(<>)으로 넘겨주면, serverApi 내부에서 알아서 ApiResponse 껍데기를 씌워서 반환해 줍니다.

async function serverFetch<T>(
  method: string,
  endpoint: string,
  body?: unknown,
  config?: RequestConfig,
): Promise<ApiResponse<T>> {
  const cookieStore = await cookies()
  const url = buildUrl(endpoint, config?.params)
  const serializedBody = serializeBody(body)

  const getAccessToken = (overrideAccessToken?: string): string | undefined =>
    overrideAccessToken ?? cookieStore.get('accessToken')?.value

  const doFetch = (accessToken?: string) =>
    fetch(url, {
      method,
      headers: {
        ...(typeof serializedBody === 'string' && {
          'Content-Type': 'application/json',
        }),
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        ...config?.headers,
      },
      body: serializedBody as BodyInit,
      cache: config?.cache,
      next: config?.next,
    })

  let res: Response
  try {
    res = await doFetch(getAccessToken())
  } catch {
    throw new NetworkError()
  }

  if (res.status === 401) {
    const newAccessToken = await tryRefresh(cookieStore)
    if (!newAccessToken) {
      try {
        cookieStore.delete('accessToken')
        cookieStore.delete('refreshToken')
      } catch {
        // RSC 컨텍스트에서는 쿠키 삭제 불가 — proxy 루프 방지 불가
      }
      redirect('/api/auth/logout?redirectTo=/signin')
    }

    try {
      res = await doFetch(getAccessToken(newAccessToken))
    } catch {
      throw new NetworkError()
    }
  }

  return await handleResponse<T>(res, config)
}

/**
 * 서버 전용 API 인터페이스.
 * Server Action, service 레이어, RSC에서 사용.
 * 클라이언트 컴포넌트에서 import 금지 (next/headers는 서버 전용).
 * 에러 발생 시 throw — 호출 측에서 try/catch 사용.
 *
 * @example
 * // RSC
 * const data = await serverApi.get<User>('/me')
 *
 * // Server Action (에러를 클라이언트에 직접 노출하면 안 되므로 try/catch 필수)
 * try {
 *   const data = await serverApi.post('/interviews', body)
 *   return { success: true, data }
 * } catch (error) {
 *   return { success: false, message: error.message }
 * }
 */
export const serverApi = {
  get: <T>(endpoint: string, config?: RequestConfig) =>
    serverFetch<T>('GET', endpoint, undefined, config),

  post: <T>(endpoint: string, body?: unknown, config?: RequestConfig) =>
    serverFetch<T>('POST', endpoint, body, config),

  put: <T>(endpoint: string, body?: unknown, config?: RequestConfig) =>
    serverFetch<T>('PUT', endpoint, body, config),

  patch: <T>(endpoint: string, body?: unknown, config?: RequestConfig) =>
    serverFetch<T>('PATCH', endpoint, body, config),

  delete: <T>(endpoint: string, config?: RequestConfig) =>
    serverFetch<T>('DELETE', endpoint, undefined, config),
}
