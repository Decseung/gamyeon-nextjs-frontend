'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getCurrentUser, withdrawUser } from '@/featured/auth/services/auth.service'
import { withAction } from '@/shared/lib/withAction'
import type { ApiResponse } from '@/shared/lib/api'
import type { User } from '@/featured/auth/types'

export async function verifyCurrentUser(): Promise<User> {
  return getCurrentUser()
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
