import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { parseSetCookieExpires } from '@/shared/lib/utils/cookie'
import type { ApiResponse } from '@/shared/lib/api/types'

type TokenData = {
  accessToken?: string
  refreshToken?: string
}

function refreshFailure(status: number, data?: Partial<ApiResponse<TokenData>>) {
  const response = NextResponse.json(
    { success: false, code: data?.code, message: data?.message },
    { status },
  )
  response.cookies.delete('accessToken')
  response.cookies.delete('refreshToken')
  return response
}

export async function POST() {
  try {
    const cookieStore = await cookies()

    const refreshToken = cookieStore.get('refreshToken')?.value
    if (!refreshToken) {
      return refreshFailure(401)
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '')

    const res = await fetch(`${apiUrl}/api/v1/auth/reissue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })

    const data = (await res.json().catch(() => ({}))) as Partial<ApiResponse<TokenData>>

    if (!data.success || !data.data?.accessToken) {
      return refreshFailure(res.status || 401, data)
    }

    const response = NextResponse.json({ success: true, accessToken: data.data.accessToken })
    const isProd = process.env.NODE_ENV === 'production'
    const expiresMap = parseSetCookieExpires(res.headers.getSetCookie?.() ?? [])

    response.cookies.set('accessToken', data.data.accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      expires: expiresMap.get('accessToken'),
    })

    if (data.data.refreshToken) {
      response.cookies.set('refreshToken', data.data.refreshToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        path: '/',
        expires: expiresMap.get('refreshToken'),
      })
    }

    return response
  } catch {
    return refreshFailure(500)
  }
}
