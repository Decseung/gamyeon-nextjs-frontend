import { serverApi } from '@/shared/lib/api'
import type { ApiResponse } from '@/shared/lib/api'
import type { UpdateNicknameRequest } from '../types'

export async function updateNickname(
  request: UpdateNicknameRequest,
): Promise<ApiResponse<unknown>> {
  return serverApi.patch<unknown>('/api/v1/users/me/nickname', request)
}
