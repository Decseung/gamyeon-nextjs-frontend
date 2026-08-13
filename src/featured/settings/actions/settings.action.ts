'use server'

import type { ApiResponse } from '@/shared/lib/api'
import { withAction } from '@/shared/lib/withAction'
import { updateNickname } from '../services/settings.service'

export async function updateNicknameAction(nickname: string): Promise<ApiResponse<unknown>> {
  return withAction(() => updateNickname({ nickname }))
}
