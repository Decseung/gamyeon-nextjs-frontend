import { serverApi } from '@/shared/lib/api'
import type { ApiResponse } from '@/shared/lib/api'
import type { GetNotifsParams, NotifListData } from '../types'

const NOTIF_ENDPOINT = '/api/v1/notifs'
const DEFAULT_NOTIF_LIMIT = 5

/**
 * 알림을 최신순으로 조회한다.
 * cursorId를 생략하면 최신 알림부터, 전달하면 해당 ID보다 과거 알림부터 조회한다.
 */
export async function getNotifs(params: GetNotifsParams = {}): Promise<ApiResponse<NotifListData>> {
  const limit = params.size ?? DEFAULT_NOTIF_LIMIT
  const response = await serverApi.get<NotifListData>(NOTIF_ENDPOINT, {
    params: {
      size: limit,
      ...(params.cursorId !== undefined && { cursorId: params.cursorId }),
    },
  })

  if (!response.data || response.data.hasNext !== undefined) {
    return response
  }

  return {
    ...response,
    data: {
      ...response.data,
      hasNext: response.data.notifs.length === limit,
    },
  }
}

/** 특정 알림 한 건을 읽음 처리한다. */
export function markNotifAsRead(notifId: number): Promise<ApiResponse<null>> {
  return serverApi.patch<null>(`${NOTIF_ENDPOINT}/${notifId}/read`)
}

/** 현재 사용자의 미확인 알림을 모두 읽음 처리한다. */
export function markAllNotifsAsRead(): Promise<ApiResponse<null>> {
  return serverApi.patch<null>(`${NOTIF_ENDPOINT}/read-all`)
}
