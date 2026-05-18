import { NextRequest, NextResponse } from 'next/server'

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
  response.cookies.delete('accessToken')
  response.cookies.delete('refreshToken')
  return response
}

export async function POST() {
  const response = NextResponse.json({ success: true })
  response.cookies.delete('accessToken')
  response.cookies.delete('refreshToken')
  return response
}
