import { NextRequest, NextResponse } from 'next/server'
import { buildTokenExpiresMap } from '@/shared/lib/auth/jwt'
import {
  clearRestoreTokenCookie,
  RESTORE_TOKEN_COOKIE_NAME,
  setAuthTokenCookies,
} from '@/shared/lib/auth/cookies'
import type { User } from '@/featured/auth/types'

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

export async function POST(request: NextRequest) {
  try {
    const restoreToken = request.cookies.get(RESTORE_TOKEN_COOKIE_NAME)?.value

    if (!restoreToken) {
      return errorResponse(401, 'RESTORE_SESSION_MISSING', '계정 복구 요청이 만료되었습니다.')
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '')
    const res = await fetch(`${apiUrl}/api/v1/auth/account/restore`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ restoreToken }),
      cache: 'no-store',
    })

    const payload = asRecord(await res.json().catch(() => null))

    if (!payload) {
      return errorResponse(
        getInvalidUpstreamStatus(res),
        res.ok ? 'AUTH_RESPONSE_INVALID' : 'RESTORE_FAILED',
        '계정 복구 응답을 확인할 수 없습니다.',
      )
    }

    if (!res.ok || payload.success !== true) {
      return errorResponse(
        res.status,
        getPublicCode(payload, 'RESTORE_FAILED'),
        '계정 복구에 실패했습니다.',
      )
    }

    const authData = asRecord(payload.data)
    const accessToken = asNonEmptyString(authData?.accessToken)
    const refreshToken = asNonEmptyString(authData?.refreshToken)
    const user = getPublicUser(authData?.user)

    if (!accessToken || !refreshToken || !user) {
      return errorResponse(502, 'AUTH_RESPONSE_INVALID', '계정 복구 응답을 확인할 수 없습니다.')
    }

    const response = jsonNoStore(
      {
        success: true,
        code: getPublicCode(payload, 'SUCCESS'),
        message: '계정 복구에 성공했습니다.',
        data: { user },
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

/** 계정 복구 취소 시 브라우저에 남은 임시 복구 자격 증명을 폐기한다. */
export async function DELETE() {
  const response = jsonNoStore(
    { success: true, code: 'SUCCESS', message: '계정 복구 요청을 취소했습니다.', data: null },
    200,
  )
  clearRestoreTokenCookie(response.cookies)
  return response
}
