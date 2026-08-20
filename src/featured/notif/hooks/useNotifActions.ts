'use client'

import { useCallback, useMemo } from 'react'
import type { ApiResponse } from '@/shared/lib/api'
import {
  getNotifsAction,
  markAllNotifsAsReadAction,
  markNotifAsReadAction,
} from '../actions/notif.action'
import { useNotifStore } from '../store'
import type { NotifListData } from '../types'

class NotifActionError extends Error {
  readonly code: string

  constructor(message: string, code: string) {
    super(message)
    this.name = 'NotifActionError'
    this.code = code
  }
}

function createNotifActionError(
  response: Pick<ApiResponse<unknown>, 'code' | 'message'>,
  fallbackMessage: string,
): NotifActionError {
  return new NotifActionError(response.message || fallbackMessage, response.code || 'UNKNOWN_ERROR')
}

function getNotifListData(
  response: ApiResponse<NotifListData>,
  fallbackMessage: string,
): NotifListData {
  if (!response.success) {
    throw createNotifActionError(response, fallbackMessage)
  }

  if (response.data === null) {
    throw new NotifActionError(
      response.message || '알림 응답 데이터가 없습니다.',
      response.code || 'INVALID_RESPONSE',
    )
  }

  return response.data
}

function assertNotifActionSuccess(
  response: ApiResponse<unknown>,
  fallbackMessage: string,
): void {
  if (!response.success) {
    throw createNotifActionError(response, fallbackMessage)
  }
}

export function useNotifActions() {
  const fetchInitialNotifs = useCallback(async (signal?: AbortSignal) => {
    if (signal?.aborted || !useNotifStore.getState().beginInitialLoad()) return

    try {
      const response = await getNotifsAction()
      const data = getNotifListData(response, '알림 목록을 불러오지 못했습니다.')

      if (!signal?.aborted) {
        useNotifStore.getState().applyInitialNotifs(data)
      }
    } finally {
      useNotifStore.getState().finishInitialLoad()
    }
  }, [])

  const fetchMoreNotifs = useCallback(async () => {
    const cursorId = useNotifStore.getState().beginMoreLoad()

    if (cursorId === null) return

    try {
      const response = await getNotifsAction({ cursorId })
      const data = getNotifListData(response, '알림 목록을 추가로 불러오지 못했습니다.')

      useNotifStore.getState().appendNotifs(data)
    } finally {
      useNotifStore.getState().finishMoreLoad()
    }
  }, [])

  const markAsRead = useCallback(async (notifId: number) => {
    const targetNotif = useNotifStore.getState().notifs.find((notif) => notif.notifId === notifId)

    if (!targetNotif || targetNotif.isRead) return

    const response = await markNotifAsReadAction(notifId)
    assertNotifActionSuccess(response, '알림을 읽음 처리하지 못했습니다.')
    useNotifStore.getState().markNotifAsRead(notifId)
  }, [])

  const markAllAsRead = useCallback(async () => {
    const response = await markAllNotifsAsReadAction()
    assertNotifActionSuccess(response, '알림을 모두 읽음 처리하지 못했습니다.')
    useNotifStore.getState().markAllNotifsAsRead()
  }, [])

  return useMemo(
    () => ({ fetchInitialNotifs, fetchMoreNotifs, markAsRead, markAllAsRead }),
    [fetchInitialNotifs, fetchMoreNotifs, markAllAsRead, markAsRead],
  )
}
