const isProd = process.env.NODE_ENV === 'production'
const ACCESS_TOKEN_COOKIE_NAME = 'accessToken'
const REFRESH_TOKEN_COOKIE_NAME = 'refreshToken'
const RESTORE_TOKEN_COOKIE_PATH = '/api/auth/restore'
const RESTORE_TOKEN_MAX_AGE_MS = 10 * 60 * 1000

export const RESTORE_TOKEN_COOKIE_NAME = 'restoreToken'

interface AuthCookieOptions {
  httpOnly?: boolean
  secure?: boolean
  sameSite?: 'lax' | 'strict' | 'none'
  domain?: string
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

function getAccessTokenCookieDomain(): string | undefined {
  return process.env.AUTH_COOKIE_DOMAIN?.trim() || undefined
}

function getAccessTokenCookieOptions(expires?: Date): AuthCookieOptions {
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    domain: getAccessTokenCookieDomain(),
    path: '/',
    expires,
  }
}

function getRefreshTokenCookieOptions(expires?: Date): AuthCookieOptions {
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    expires,
  }
}

/**
 * accessToken은 AUTH_COOKIE_DOMAIN이 설정된 환경에서 API 서브도메인과 공유한다.
 * 환경변수가 없으면 localhost를 포함해 기존 host-only 쿠키 정책을 유지한다.
 */
export function setAccessTokenCookie(
  cookieSetter: CookieSetter,
  accessToken: string,
  expires?: Date,
) {
  cookieSetter.set(ACCESS_TOKEN_COOKIE_NAME, accessToken, getAccessTokenCookieOptions(expires))
}

/** refreshToken은 재발급을 담당하는 프론트엔드 호스트에만 전달한다. */
export function setRefreshTokenCookie(
  cookieSetter: CookieSetter,
  refreshToken: string,
  expires?: Date,
) {
  cookieSetter.set(REFRESH_TOKEN_COOKIE_NAME, refreshToken, getRefreshTokenCookieOptions(expires))
}

/** Domain 쿠키도 정확히 만료되도록 발급 시점과 동일한 Domain과 Path를 사용한다. */
export function clearAccessTokenCookie(cookieSetter: CookieSetter) {
  cookieSetter.set(ACCESS_TOKEN_COOKIE_NAME, '', getAccessTokenCookieOptions(new Date(0)))
}

/** host-only refreshToken을 만료시킨다. */
export function clearRefreshTokenCookie(cookieSetter: CookieSetter) {
  cookieSetter.set(REFRESH_TOKEN_COOKIE_NAME, '', getRefreshTokenCookieOptions(new Date(0)))
}

export function clearAuthTokenCookies(cookieSetter: CookieSetter) {
  clearAccessTokenCookie(cookieSetter)
  clearRefreshTokenCookie(cookieSetter)
}

/**
 * accessToken은 선택적으로 API 서브도메인과 공유하고 refreshToken은 host-only로 설정한다.
 * NextResponse.cookies와 next/headers cookies() 모두 이 인터페이스를 만족한다.
 */
export function setAuthTokenCookies(
  cookieSetter: CookieSetter,
  accessToken: string,
  refreshToken: string | undefined,
  expiresMap: Map<string, Date>,
) {
  setAccessTokenCookie(cookieSetter, accessToken, expiresMap.get('accessToken'))

  if (refreshToken) {
    setRefreshTokenCookie(cookieSetter, refreshToken, expiresMap.get('refreshToken'))
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
