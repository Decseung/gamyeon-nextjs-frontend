import { NextRequest, NextResponse } from 'next/server'
import { clearAuthTokenCookies } from '@/shared/lib/auth/cookies'

function getSafeRedirectPath(request: NextRequest): string {
  const redirectTo = request.nextUrl.searchParams.get('redirectTo') ?? '/signin'

  if (!redirectTo.startsWith('/') || redirectTo.startsWith('//')) {
    return '/signin'
  }

  return redirectTo
}

export async function GET(request: NextRequest) {
  const redirectUrl = new URL(getSafeRedirectPath(request), request.url)
  const response = NextResponse.redirect(redirectUrl)
  clearAuthTokenCookies(response.cookies)
  return response
}

export async function POST() {
  const response = NextResponse.json({ success: true })
  clearAuthTokenCookies(response.cookies)
  return response
}
