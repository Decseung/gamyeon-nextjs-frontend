'use server'

import { cookies } from 'next/headers'
import { isRedirectError } from 'next/dist/client/components/redirect-error'
import { redirect } from 'next/navigation'
import { getCurrentUser, withdrawUser } from '@/featured/auth/services/auth.service'
import { withAction } from '@/shared/lib/withAction'
import type { ApiResponse } from '@/shared/lib/api'
import type { User } from '@/featured/auth/types'
import { reissue } from '@/shared/lib/auth/reissue'
import {
  clearAccessTokenCookie,
  clearAuthTokenCookies,
  setAuthTokenCookies,
} from '@/shared/lib/auth/cookies'

export type OptionalSessionResult =
  | { status: 'authenticated'; user: User }
  | { status: 'guest' }
  | { status: 'unavailable' }

export type RefreshAuthSessionResult =
  | { status: 'refreshed' }
  | { status: 'invalid' }
  | { status: 'unavailable' }

export async function verifyCurrentUser(): Promise<User> {
  return getCurrentUser()
}

export async function verifyOptionalCurrentUser(): Promise<OptionalSessionResult> {
  const cookieStore = await cookies()

  if (!cookieStore.has('refreshToken')) {
    return { status: 'guest' }
  }

  try {
    const user = await getCurrentUser()
    return { status: 'authenticated', user }
  } catch (error) {
    // serverApi의 만료 세션 리다이렉트를 공개 페이지 밖으로 전파하지 않는다.
    if (isRedirectError(error)) {
      return { status: 'guest' }
    }

    console.error('공개 페이지에서 현재 사용자 확인에 실패했습니다.', error)
    return { status: 'unavailable' }
  }
}

/**
 * 브라우저에 refreshToken을 노출하지 않고 인증 쿠키를 갱신한다.
 * invalid만 재로그인이 필요한 확정 상태이며, 일시적 네트워크 오류는 쿠키를 유지한다.
 */
export async function refreshAuthSession(): Promise<RefreshAuthSessionResult> {
  const cookieStore = await cookies()
  const refreshToken = cookieStore.get('refreshToken')?.value

  if (!refreshToken) {
    clearAccessTokenCookie(cookieStore)
    return { status: 'invalid' }
  }

  const result = await reissue(refreshToken)
  if (!result.ok) {
    if (result.reason === 'network') {
      return { status: 'unavailable' }
    }

    clearAuthTokenCookies(cookieStore)
    return { status: 'invalid' }
  }

  setAuthTokenCookies(cookieStore, result.accessToken, result.refreshToken, result.expiresMap)
  return { status: 'refreshed' }
}

export async function logoutAction() {
  const cookieStore = await cookies()
  clearAuthTokenCookies(cookieStore)
}

export async function withdrawUserAction(): Promise<ApiResponse<null>> {
  return withAction<null>(async () => {
    await withdrawUser()
    const cookieStore = await cookies()
    clearAuthTokenCookies(cookieStore)
    redirect('/signin?withdrawal=complete')
  })
}
