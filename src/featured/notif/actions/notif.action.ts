'use server'

import type { ApiResponse } from '@/shared/lib/api'
import { withAction } from '@/shared/lib/withAction'
import { getNotifs, markAllNotifsAsRead, markNotifAsRead } from '../services/notif.service'
import type { GetNotifsParams, NotifListData } from '../types'

export async function getNotifsAction(
  params: GetNotifsParams = {},
): Promise<ApiResponse<NotifListData>> {
  return withAction(() => getNotifs(params))
}

export async function markNotifAsReadAction(notifId: number): Promise<ApiResponse<null>> {
  if (!Number.isSafeInteger(notifId) || notifId <= 0) {
    return {
      success: false,
      code: 'INVALID_ARGUMENT',
      message: '유효하지 않은 알림 ID입니다.',
      data: null,
    }
  }

  return withAction(() => markNotifAsRead(notifId))
}

export async function markAllNotifsAsReadAction(): Promise<ApiResponse<null>> {
  return withAction(() => markAllNotifsAsRead())
}
