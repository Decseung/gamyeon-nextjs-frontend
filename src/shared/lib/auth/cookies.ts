const isProd = process.env.NODE_ENV === 'production'

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
