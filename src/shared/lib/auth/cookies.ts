const isProd = process.env.NODE_ENV === 'production'
const RESTORE_TOKEN_COOKIE_PATH = '/api/auth/restore'
const RESTORE_TOKEN_MAX_AGE_MS = 10 * 60 * 1000

export const RESTORE_TOKEN_COOKIE_NAME = 'restoreToken'

interface AuthCookieOptions {
  httpOnly?: boolean
  secure?: boolean
  sameSite?: 'lax' | 'strict' | 'none'
  path?: string
  expires?: Date
}

interface CookieSetter {
  set(name: string, value: string, options?: AuthCookieOptions): unknown
}

function getRestoreTokenExpiry(restorableUntil?: string | null): Date {
  const shortLivedExpiry = Date.now() + RESTORE_TOKEN_MAX_AGE_MS
  const restorableUntilTimestamp = restorableUntil ? Date.parse(restorableUntil) : Number.NaN

  if (Number.isNaN(restorableUntilTimestamp)) {
    return new Date(shortLivedExpiry)
  }

  return new Date(Math.min(shortLivedExpiry, restorableUntilTimestamp))
}

/**
 * accessToken/refreshToken 쿠키를 표준 옵션으로 설정한다.
 * NextResponse.cookies와 next/headers cookies() 모두 이 인터페이스를 만족한다.
 */
export function setAuthTokenCookies(
  cookieSetter: CookieSetter,
  accessToken: string,
  refreshToken: string | undefined,
  expiresMap: Map<string, Date>,
) {
  cookieSetter.set('accessToken', accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    expires: expiresMap.get('accessToken'),
  })

  if (refreshToken) {
    cookieSetter.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      expires: expiresMap.get('refreshToken'),
    })
  }
}

/**
 * 계정 복구 토큰은 브라우저 JavaScript에 노출하지 않고 복구 API 경로에서만 사용한다.
 */
export function setRestoreTokenCookie(
  cookieSetter: CookieSetter,
  restoreToken: string,
  restorableUntil?: string | null,
) {
  cookieSetter.set(RESTORE_TOKEN_COOKIE_NAME, restoreToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'strict',
    path: RESTORE_TOKEN_COOKIE_PATH,
    expires: getRestoreTokenExpiry(restorableUntil),
  })
}

/** 복구 완료 또는 취소 시 경로가 제한된 임시 복구 쿠키를 제거한다. */
export function clearRestoreTokenCookie(cookieSetter: CookieSetter) {
  cookieSetter.set(RESTORE_TOKEN_COOKIE_NAME, '', {
    httpOnly: true,
    secure: isProd,
    sameSite: 'strict',
    path: RESTORE_TOKEN_COOKIE_PATH,
    expires: new Date(0),
  })
}
