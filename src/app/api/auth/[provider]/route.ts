import { NextRequest, NextResponse } from 'next/server'
import { buildTokenExpiresMap } from '@/shared/lib/auth/jwt'
import {
  clearRestoreTokenCookie,
  setAuthTokenCookies,
  setRestoreTokenCookie,
} from '@/shared/lib/auth/cookies'
import type { User } from '@/featured/auth/types'

const SUPPORTED_PROVIDERS = ['google', 'kakao'] as const
type Provider = (typeof SUPPORTED_PROVIDERS)[number]
type UnknownRecord = Record<string, unknown>

function asRecord(value: unknown): UnknownRecord | null {
  return typeof value === 'object' && value !== null ? (value as UnknownRecord) : null
}

function asNonEmptyString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null
}

function getPublicCode(payload: UnknownRecord | null, fallback: string): string {
  const code = payload?.code
  return typeof code === 'string' && /^[A-Z0-9_-]{1,64}$/.test(code) ? code : fallback
}

function getPublicUser(value: unknown): User | null {
  const user = asRecord(value)
  if (
    !user ||
    typeof user.id !== 'number' ||
    typeof user.email !== 'string' ||
    typeof user.nickname !== 'string' ||
    typeof user.provider !== 'string' ||
    typeof user.status !== 'string' ||
    typeof user.createdAt !== 'string'
  ) {
    return null
  }

  return {
    id: user.id,
    email: user.email,
    nickname: user.nickname,
    provider: user.provider,
    status: user.status,
    createdAt: user.createdAt,
    ...(typeof user.name === 'string' ? { name: user.name } : {}),
    ...(typeof user.avatar === 'string' ? { avatar: user.avatar } : {}),
  }
}

function jsonNoStore(body: unknown, status: number) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  })
}

function errorResponse(status: number, code: string, message: string) {
  return jsonNoStore({ success: false, code, message, data: null }, status)
}

function getInvalidUpstreamStatus(response: Response): number {
  return response.ok || response.status === 304 ? 502 : response.status
}

/**
 * POST /api/auth/[provider]
 * OAuth 인증 코드를 백엔드로 전달하고 민감한 토큰은 HttpOnly 쿠키로만 저장한다.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  try {
    const { provider } = await params

    if (!SUPPORTED_PROVIDERS.includes(provider as Provider)) {
      return errorResponse(400, 'CMMN-V002', '지원하지 않는 provider입니다.')
    }

    const body = asRecord(await request.json())
    const authorizationCode = asNonEmptyString(body?.authorizationCode)
    const codeVerifier = asNonEmptyString(body?.codeVerifier)

    if (!authorizationCode) {
      return errorResponse(400, 'CMMN-V001', 'authorizationCode가 없습니다.')
    }

    if (!codeVerifier) {
      return errorResponse(400, 'CMMN-V001', 'codeVerifier가 없습니다.')
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
      cache: 'no-store',
    })

    const payload = asRecord(await res.json().catch(() => null))

    if (!payload) {
      return errorResponse(
        getInvalidUpstreamStatus(res),
        res.ok ? 'AUTH_RESPONSE_INVALID' : 'AUTH_FAILED',
        '로그인 인증 응답을 확인할 수 없습니다.',
      )
    }

    if (!res.ok || payload.success !== true) {
      return errorResponse(
        res.status,
        getPublicCode(payload, 'AUTH_FAILED'),
        '로그인 인증에 실패했습니다.',
      )
    }

    const authData = asRecord(payload.data)
    const user = getPublicUser(authData?.user)
    const restoreToken = asNonEmptyString(authData?.restoreToken)
    const restorableUntil = asNonEmptyString(authData?.restorableUntil)
    const code = getPublicCode(payload, 'SUCCESS')

    if (restoreToken) {
      const response = jsonNoStore(
        {
          success: true,
          code,
          message: '복구 가능한 계정이 있습니다.',
          data: { user, restoreRequired: true, restorableUntil },
        },
        res.status,
      )
      setRestoreTokenCookie(response.cookies, restoreToken, restorableUntil)
      return response
    }

    const accessToken = asNonEmptyString(authData?.accessToken)
    const refreshToken = asNonEmptyString(authData?.refreshToken)

    if (!accessToken || !refreshToken || !user) {
      return errorResponse(502, 'AUTH_RESPONSE_INVALID', '로그인 인증 응답을 확인할 수 없습니다.')
    }

    const response = jsonNoStore(
      {
        success: true,
        code,
        message: '로그인에 성공했습니다.',
        data: { user, restoreRequired: false, restorableUntil: null },
      },
      res.status,
    )
    const expiresMap = buildTokenExpiresMap(accessToken, refreshToken, res.headers.getSetCookie())
    setAuthTokenCookies(response.cookies, accessToken, refreshToken, expiresMap)
    clearRestoreTokenCookie(response.cookies)

    return response
  } catch {
    return errorResponse(500, 'NETWORK_ERROR', '서버 연결에 실패했습니다.')
  }
}
