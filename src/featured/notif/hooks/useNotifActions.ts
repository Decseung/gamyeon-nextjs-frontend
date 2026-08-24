'use client'

import { useCallback, useMemo } from 'react'
import { useAuthStore } from '@/featured/auth/store'
import type { ApiResponse } from '@/shared/lib/api'
import {
  getNotifsAction,
  markAllNotifsAsReadAction,
  markNotifAsReadAction,
} from '../actions/notif.action'
import { useNotifStore } from '../store'
import type { NotifListData, NotifReadAllSnapshot } from '../types'

const MUTATION_SETTLE_DELAY_MS = 250

interface InitialNotifLoad {
  sessionKey: string
  generation: number
  promise: Promise<void>
}

interface NotifSessionSnapshot {
  sessionKey: string
  generation: number
}

let initialNotifLoad: InitialNotifLoad | null = null
let notifSessionGeneration = 0

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

function assertNotifActionSuccess(response: ApiResponse<unknown>, fallbackMessage: string): void {
  if (!response.success) {
    throw createNotifActionError(response, fallbackMessage)
  }
}

function waitForDelay(delayMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, delayMs))
}

function getCurrentNotifSession(): NotifSessionSnapshot | null {
  const authState = useAuthStore.getState()

  if (!authState.isLoggedIn || authState.user === null) return null

  return {
    sessionKey: String(authState.user.id),
    generation: notifSessionGeneration,
  }
}

function isCurrentNotifSession(sessionKey: string, generation: number): boolean {
  const authState = useAuthStore.getState()

  return (
    notifSessionGeneration === generation &&
    authState.isLoggedIn &&
    authState.user !== null &&
    String(authState.user.id) === sessionKey
  )
}

async function waitForNotifMutationsToSettle(
  sessionKey: string,
  generation: number,
): Promise<boolean> {
  let lastRevision = useNotifStore.getState().mutationRevision

  while (isCurrentNotifSession(sessionKey, generation)) {
    await waitForDelay(MUTATION_SETTLE_DELAY_MS)

    if (!isCurrentNotifSession(sessionKey, generation)) return false

    const currentRevision = useNotifStore.getState().mutationRevision
    if (currentRevision === lastRevision) return true

    lastRevision = currentRevision
  }

  return false
}

async function performInitialNotifLoad(sessionKey: string, generation: number): Promise<void> {
  if (
    !isCurrentNotifSession(sessionKey, generation) ||
    !useNotifStore.getState().beginInitialLoad()
  ) {
    return
  }

  try {
    while (isCurrentNotifSession(sessionKey, generation)) {
      const revisionAtRequestStart = useNotifStore.getState().mutationRevision
      const response = await getNotifsAction()

      if (!isCurrentNotifSession(sessionKey, generation)) return

      const data = getNotifListData(response, '알림 목록을 불러오지 못했습니다.')

      if (useNotifStore.getState().mutationRevision === revisionAtRequestStart) {
        useNotifStore.getState().applyInitialNotifs(data)
        return
      }

      const hasSettled = await waitForNotifMutationsToSettle(sessionKey, generation)
      if (!hasSettled) return
    }
  } finally {
    useNotifStore.getState().finishInitialLoad()
  }
}

function requestInitialNotifs(sessionKey: string): Promise<void> {
  const generation = notifSessionGeneration

  if (initialNotifLoad?.sessionKey === sessionKey && initialNotifLoad.generation === generation) {
    return initialNotifLoad.promise
  }

  if (initialNotifLoad) {
    return initialNotifLoad.promise
      .catch(() => undefined)
      .then(() => requestInitialNotifs(sessionKey))
  }

  const promise = performInitialNotifLoad(sessionKey, generation).finally(() => {
    if (initialNotifLoad?.promise === promise) {
      initialNotifLoad = null
    }
  })

  initialNotifLoad = { sessionKey, generation, promise }
  return promise
}

/** 인증 경계가 바뀐 뒤 이전 세션의 비동기 결과가 store에 적용되지 않게 한다. */
export function invalidateNotifSession(): void {
  notifSessionGeneration += 1
}

export function useNotifActions() {
  const fetchInitialNotifs = useCallback(
    (sessionKey: string) => requestInitialNotifs(sessionKey),
    [],
  )

  const fetchMoreNotifs = useCallback(async () => {
    const session = getCurrentNotifSession()
    if (!session) return

    const cursorId = useNotifStore.getState().beginMoreLoad()

    if (cursorId === null) return

    const revisionAtRequestStart = useNotifStore.getState().mutationRevision

    try {
      const response = await getNotifsAction({ cursorId })
      const data = getNotifListData(response, '알림 목록을 추가로 불러오지 못했습니다.')

      if (!isCurrentNotifSession(session.sessionKey, session.generation)) return

      if (useNotifStore.getState().mutationRevision !== revisionAtRequestStart) return

      useNotifStore.getState().appendNotifs(data)
    } finally {
      if (isCurrentNotifSession(session.sessionKey, session.generation)) {
        useNotifStore.getState().finishMoreLoad()
      }
    }
  }, [])

  const markAsRead = useCallback(async (notifId: number) => {
    const session = getCurrentNotifSession()
    if (!session) return

    const targetNotif = useNotifStore.getState().notifs.find((notif) => notif.notifId === notifId)

    if (!targetNotif) return

    const removedNotif = useNotifStore.getState().beginNotifRead(notifId)
    if (!removedNotif) return

    try {
      const response = await markNotifAsReadAction(notifId)
      assertNotifActionSuccess(response, '알림을 읽음 처리하지 못했습니다.')

      if (!isCurrentNotifSession(session.sessionKey, session.generation)) return

      useNotifStore.getState().confirmNotifRead(notifId)
    } catch (error) {
      if (isCurrentNotifSession(session.sessionKey, session.generation)) {
        useNotifStore.getState().rollbackNotifRead(removedNotif)
      }

      throw error
    }
  }, [])

  const markProcessingAsRead = useCallback(async (notifId: number) => {
    const session = getCurrentNotifSession()
    if (!session) return

    const targetNotif = useNotifStore.getState().notifs.find((notif) => notif.notifId === notifId)

    if (!targetNotif || targetNotif.notifType !== 'REPORT_PROCESSING' || targetNotif.isRead) return

    const response = await markNotifAsReadAction(notifId)
    assertNotifActionSuccess(response, '알림을 읽음 처리하지 못했습니다.')

    if (!isCurrentNotifSession(session.sessionKey, session.generation)) return

    useNotifStore.getState().markNotifAsReadInPlace(notifId)
  }, [])

  const markAllAsRead = useCallback(async () => {
    const session = getCurrentNotifSession()
    if (!session) return

    const notifState = useNotifStore.getState()
    const snapshot: NotifReadAllSnapshot = {
      notifIds: notifState.notifs.map((notif) => notif.notifId),
      pendingReadNotifIds: Array.from(notifState.pendingReadNotifIds),
      unreadCount: notifState.unreadCount,
    }

    const response = await markAllNotifsAsReadAction()
    assertNotifActionSuccess(response, '알림을 모두 읽음 처리하지 못했습니다.')

    if (!isCurrentNotifSession(session.sessionKey, session.generation)) return

    useNotifStore.getState().removeNotifsAsRead(snapshot)
  }, [])

  return useMemo(
    () => ({
      fetchInitialNotifs,
      fetchMoreNotifs,
      markAsRead,
      markProcessingAsRead,
      markAllAsRead,
    }),
    [fetchInitialNotifs, fetchMoreNotifs, markAllAsRead, markAsRead, markProcessingAsRead],
  )
}
