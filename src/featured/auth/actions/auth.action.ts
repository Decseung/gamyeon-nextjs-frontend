'use server'

import { cookies } from 'next/headers'
import { isRedirectError } from 'next/dist/client/components/redirect-error'
import { redirect } from 'next/navigation'
import { getCurrentUser, withdrawUser } from '@/featured/auth/services/auth.service'
import { withAction } from '@/shared/lib/withAction'
import type { ApiResponse } from '@/shared/lib/api'
import type { User } from '@/featured/auth/types'

export type OptionalSessionResult =
  | { status: 'authenticated'; user: User }
  | { status: 'guest' }
  | { status: 'unavailable' }

export async function verifyCurrentUser(): Promise<User> {
  return getCurrentUser()
}

export async function verifyOptionalCurrentUser(): Promise<OptionalSessionResult> {
  const cookieStore = await cookies()

  if (!cookieStore.has('refreshToken')) {
    return { status: 'guest' }
  }

  try {
    const user = await getCurrentUser()
    return { status: 'authenticated', user }
  } catch (error) {
    // serverApi의 만료 세션 리다이렉트를 공개 페이지 밖으로 전파하지 않는다.
    if (isRedirectError(error)) {
      return { status: 'guest' }
    }

    console.error('공개 페이지에서 현재 사용자 확인에 실패했습니다.', error)
    return { status: 'unavailable' }
  }
}

export async function logoutAction() {
  const cookieStore = await cookies()
  cookieStore.delete('accessToken')
  cookieStore.delete('refreshToken')
}

export async function withdrawUserAction(): Promise<ApiResponse<null>> {
  return withAction<null>(async () => {
    await withdrawUser()
    const cookieStore = await cookies()
    cookieStore.delete('accessToken')
    cookieStore.delete('refreshToken')
    redirect('/signin?withdrawal=complete')
  })
}
