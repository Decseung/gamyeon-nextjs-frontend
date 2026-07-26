import { NextRequest, NextResponse } from 'next/server'
import { buildTokenExpiresMap } from '@/shared/lib/auth/jwt'
import { setAuthTokenCookies } from '@/shared/lib/auth/cookies'

const SUPPORTED_PROVIDERS = ['google', 'kakao'] as const
type Provider = (typeof SUPPORTED_PROVIDERS)[number]

/**
 * POST /api/auth/[provider]
 * OAuth authorizationCode를 받아 백엔드로 전달하고 토큰을 반환.
 * 브라우저 → Next.js 서버(동일 출처) → 백엔드(서버 간 요청) 구조로 CORS 우회.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  try {
    const { provider } = await params

    if (!SUPPORTED_PROVIDERS.includes(provider as Provider)) {
      return NextResponse.json(
        { success: false, code: 'CMMN-V002', message: '지원하지 않는 provider입니다.' },
        { status: 400 },
      )
    }

    const body = await request.json()
    const { authorizationCode, codeVerifier } = body

    if (!authorizationCode) {
      return NextResponse.json(
        { success: false, code: 'CMMN-V001', message: 'authorizationCode가 없습니다.' },
        { status: 400 },
      )
    }

    if (!codeVerifier) {
      return NextResponse.json(
        { success: false, code: 'CMMN-V001', message: 'codeVerifier가 없습니다.' },
        { status: 400 },
      )
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '')
    const redirectUri =
      provider === 'google'
        ? process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI
        : process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI
    const res = await fetch(`${apiUrl}/api/v1/auth/login/${provider}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ authorizationCode, codeVerifier, redirectUri }),
    })

    const data = await res.json()

    if (!data.success) {
      data.message = '로그인 인증에 실패했습니다.'
    }

    const response = NextResponse.json(data, { status: res.status })

    if (data.success && data.data) {
      const expiresMap = buildTokenExpiresMap(
        data.data.accessToken,
        data.data.refreshToken,
        res.headers.getSetCookie(),
      )
      setAuthTokenCookies(
        response.cookies,
        data.data.accessToken,
        data.data.refreshToken,
        expiresMap,
      )
    }

    return response
  } catch {
    return NextResponse.json(
      { success: false, code: 'NETWORK_ERROR', message: '서버 연결에 실패했습니다.' },
      { status: 500 },
    )
  }
}
