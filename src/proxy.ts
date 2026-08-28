import { NextRequest, NextResponse } from 'next/server'
import { reissue } from '@/shared/lib/auth/reissue'
import { clearAuthTokenCookies, setAuthTokenCookies } from '@/shared/lib/auth/cookies'

const PUBLIC_PATHS = ['/', '/signin', '/terms', '/privacy']

/**
 * 보호 라우트 진입 게이트키퍼.
 *
 * - refreshToken 없음 → /signin 리다이렉트 (복구 불가)
 * - accessToken 있음 → 통과 (평상시 경로, 추가 비용 없음)
 * - accessToken 없음(만료로 브라우저가 삭제) → 여기서 조건부로 재발급 시도.
 *   성공 시 요청 쿠키를 재작성해 이번 렌더 패스부터 새 accessToken을 쓰게 하고,
 *   응답 쿠키에도 저장해 브라우저에 영속화한다. 그 결과 이후 RSC/Server Action
 *   레이어(serverApi)에서는 401이 발생하지 않는다.
 *   백엔드가 명시적으로 거부한 경우(reason: 'invalid')만 로그아웃 처리하고,
 *   네트워크 오류 등 일시적 실패(reason: 'network')는 쿠키를 건드리지 않고
 *   통과시켜 serverApi의 tryRefresh 폴백에 한 번 더 기회를 준다.
 *
 * accessToken 쿠키의 만료 시각은 JWT의 exp보다 살짝 이르게 설정되어 있어(reissue.ts
 * 참고), 정상적인 경우 accessToken이 실제로 죽기 전에 쿠키가 먼저 사라지고 이 경로가
 * 선제적으로 재발급을 처리한다. serverApi의 폴백은 그 사이 요청 도중 만료되는
 * 드문 경우에만 동작한다.
 *
 * refreshToken이 rotation 방식이고 grace period가 없는 백엔드라면, 만료 시점에
 * 여러 탭/인스턴스에서 동시에 재발급을 시도하는 경우까지는 막지 못한다.
 * 같은 서버 인스턴스 내 동시 요청은 reissue()의 single-flight로 병합된다.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const refreshToken = request.cookies.get('refreshToken')?.value

  // 로그인 상태에서 /signin 접근 시 대시보드로 이동
  if (pathname === '/signin' && refreshToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  const isPublic = PUBLIC_PATHS.some((path) => pathname === path)
  if (isPublic) return NextResponse.next()

  if (!refreshToken) {
    return NextResponse.redirect(new URL('/signin', request.url))
  }

  const accessToken = request.cookies.get('accessToken')?.value
  if (accessToken) return NextResponse.next()

  const result = await reissue(refreshToken)

  if (!result.ok) {
    if (result.reason === 'network') {
      // 일시적 오류 — 로그아웃시키지 않고 그대로 통과, serverApi 폴백에 위임
      console.warn(`[proxy] reissue network 실패, 폴백에 위임: ${pathname}`)
      return NextResponse.next()
    }
    console.error(
      `[proxy] reissue invalid, 로그아웃 처리: ${pathname} code=${result.code} message=${result.message}`,
    )
    const response = NextResponse.redirect(new URL('/signin', request.url))
    clearAuthTokenCookies(response.cookies)
    return response
  }

  request.cookies.set('accessToken', result.accessToken)
  if (result.refreshToken) request.cookies.set('refreshToken', result.refreshToken)

  const response = NextResponse.next({ request })
  setAuthTokenCookies(response.cookies, result.accessToken, result.refreshToken, result.expiresMap)
  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|images|videos).*)'],
}
