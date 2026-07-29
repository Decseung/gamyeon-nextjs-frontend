import type { User } from '@/featured/auth/types'
import { serverApi } from '@/shared/lib/api'

export async function getCurrentUser(): Promise<User> {
  const response = await serverApi.get<User>('/api/v1/users/me', {
    cache: 'no-store',
  })

  if (!response.data) {
    throw new Error('The current-user API returned a successful response without user data.')
  }

  return response.data
}
