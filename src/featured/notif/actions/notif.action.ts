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
  return withAction(() => markNotifAsRead(notifId))
}

export async function markAllNotifsAsReadAction(): Promise<ApiResponse<null>> {
  return withAction(() => markAllNotifsAsRead())
}
