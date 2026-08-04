import { NextRequest, NextResponse } from 'next/server'
import { buildTokenExpiresMap } from '@/shared/lib/auth/jwt'
import { setAuthTokenCookies } from '@/shared/lib/auth/cookies'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { restoreToken } = body

    if (!restoreToken) {
      return NextResponse.json(
        { success: false, code: 'CMMN-V001', message: 'restoreToken이 없습니다.' },
        { status: 400 },
      )
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '')
    const res = await fetch(`${apiUrl}/api/v1/auth/account/restore`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ restoreToken }),
    })

    const data = await res.json()

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
