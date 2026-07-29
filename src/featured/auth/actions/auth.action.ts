'use server'

import { cookies } from 'next/headers'
import { getCurrentUser } from '@/featured/auth/services/auth.service'
import type { User } from '@/featured/auth/types'

export async function verifyCurrentUser(): Promise<User> {
  return getCurrentUser()
}

/**
 * 로그아웃 Server Action.
 * httpOnly 쿠키(accessToken, refreshToken)를 서버에서 삭제한다.
 * Zustand 초기화 및 페이지 이동은 호출 측 클라이언트에서 처리.
 */
export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete('accessToken')
  cookieStore.delete('refreshToken')
}
