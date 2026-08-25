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
import type { Notif, NotifListData } from '../types'

const MUTATION_SETTLE_DELAY_MS = 250
const UNREAD_COUNT_RESYNC_RETRY_DELAY_MS = 1000
const SUPPRESSED_READ_RETRY_BASE_DELAY_MS = 1000
const SUPPRESSED_READ_RETRY_MAX_DELAY_MS = 30000

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
let unreadCountResyncRetryTimer: ReturnType<typeof setTimeout> | null = null
const activeSuppressedReadKeys = new Set<string>()
const suppressedReadRetryAttempts = new Map<string, number>()
const suppressedReadRetryTimers = new Map<string, ReturnType<typeof setTimeout>>()

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

function clearUnreadCountResyncRetry(): void {
  if (unreadCountResyncRetryTimer === null) return

  clearTimeout(unreadCountResyncRetryTimer)
  unreadCountResyncRetryTimer = null
}

function getSuppressedReadKey(session: NotifSessionSnapshot, notifId: number): string {
  return `${session.generation}:${session.sessionKey}:${notifId}`
}

function clearSuppressedReadRetries(): void {
  for (const timer of suppressedReadRetryTimers.values()) {
    clearTimeout(timer)
  }

  activeSuppressedReadKeys.clear()
  suppressedReadRetryAttempts.clear()
  suppressedReadRetryTimers.clear()
}

function scheduleSuppressedReadRetry(
  notifId: number,
  session: NotifSessionSnapshot,
  key: string,
): void {
  if (
    !isCurrentNotifSession(session.sessionKey, session.generation) ||
    !useNotifStore.getState().unsyncedSuppressedNotifIds.has(notifId) ||
    suppressedReadRetryTimers.has(key)
  ) {
    return
  }

  const retryAttempt = (suppressedReadRetryAttempts.get(key) ?? 0) + 1
  suppressedReadRetryAttempts.set(key, retryAttempt)
  const retryDelay = Math.min(
    SUPPRESSED_READ_RETRY_BASE_DELAY_MS * 2 ** Math.min(retryAttempt - 1, 5),
    SUPPRESSED_READ_RETRY_MAX_DELAY_MS,
  )

  const timer = setTimeout(() => {
    suppressedReadRetryTimers.delete(key)
    syncSuppressedNotifRead(notifId, session)
  }, retryDelay)
  suppressedReadRetryTimers.set(key, timer)
}

async function syncSuppressedNotifRead(
  notifId: number,
  session: NotifSessionSnapshot,
): Promise<void> {
  const key = getSuppressedReadKey(session, notifId)

  if (
    activeSuppressedReadKeys.has(key) ||
    !isCurrentNotifSession(session.sessionKey, session.generation) ||
    !useNotifStore.getState().unsyncedSuppressedNotifIds.has(notifId)
  ) {
    return
  }

  activeSuppressedReadKeys.add(key)

  try {
    const response = await markNotifAsReadAction(notifId)
    assertNotifActionSuccess(response, 'Failed to mark the superseded notification as read.')
  } catch (error) {
    if (isCurrentNotifSession(session.sessionKey, session.generation)) {
      console.error('Failed to sync a superseded notification read.', error)
      scheduleSuppressedReadRetry(notifId, session, key)
    }
    return
  } finally {
    activeSuppressedReadKeys.delete(key)
  }

  if (!isCurrentNotifSession(session.sessionKey, session.generation)) return

  suppressedReadRetryAttempts.delete(key)
  useNotifStore.getState().confirmSuppressedNotifRead(notifId)
  resyncIfPendingSettled(session)
}

function syncSuppressedNotifReads(notifIds: number[], session: NotifSessionSnapshot): void {
  for (const notifId of notifIds) {
    void syncSuppressedNotifRead(notifId, session)
  }
}

/** pending 읽음을 모두 해소한 시점에 배지 unreadCount를 서버 값으로 재동기화한다. */
function resyncIfPendingSettled(session: NotifSessionSnapshot, isRetry = false): void {
  if (!isCurrentNotifSession(session.sessionKey, session.generation)) return
  const notifState = useNotifStore.getState()
  if (
    notifState.pendingReadNotifIds.size > 0 ||
    notifState.unsyncedSuppressedNotifIds.size > 0 ||
    notifState.isMarkingAllAsRead
  ) {
    return
  }

  void requestNotifResync(session)
    .then(clearUnreadCountResyncRetry)
    .catch((error: unknown) => {
      if (!isCurrentNotifSession(session.sessionKey, session.generation)) return

      console.error('알림 배지 재동기화에 실패했습니다.', error)

      if (isRetry || unreadCountResyncRetryTimer !== null) return

      unreadCountResyncRetryTimer = setTimeout(() => {
        unreadCountResyncRetryTimer = null
        resyncIfPendingSettled(session, true)
      }, UNREAD_COUNT_RESYNC_RETRY_DELAY_MS)
    })
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
        const newlySuppressedNotifIds = useNotifStore.getState().applyInitialNotifs(data)
        syncSuppressedNotifReads(newlySuppressedNotifIds, { sessionKey, generation })
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

function requestNotifResync(session: NotifSessionSnapshot): Promise<void> {
  const activeLoad = initialNotifLoad

  if (
    activeLoad?.sessionKey !== session.sessionKey ||
    activeLoad.generation !== session.generation
  ) {
    return requestInitialNotifs(session.sessionKey)
  }

  return activeLoad.promise
    .catch(() => undefined)
    .then(() => {
      if (!isCurrentNotifSession(session.sessionKey, session.generation)) return
      return requestInitialNotifs(session.sessionKey)
    })
}

/** 인증 경계가 바뀐 뒤 이전 세션의 비동기 결과가 store에 적용되지 않게 한다. */
export function invalidateNotifSession(): void {
  clearUnreadCountResyncRetry()
  clearSuppressedReadRetries()
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

      const newlySuppressedNotifIds = useNotifStore.getState().appendNotifs(data)
      syncSuppressedNotifReads(newlySuppressedNotifIds, session)
    } finally {
      if (isCurrentNotifSession(session.sessionKey, session.generation)) {
        useNotifStore.getState().finishMoreLoad()
      }
    }
  }, [])

  const receiveNotif = useCallback((notif: Notif) => {
    const session = getCurrentNotifSession()
    if (!session) return

    const newlySuppressedNotifIds = useNotifStore.getState().prependNotif(notif)
    syncSuppressedNotifReads(newlySuppressedNotifIds, session)
  }, [])

  const markAsRead = useCallback(async (notifId: number) => {
    const session = getCurrentNotifSession()
    if (!session) return

    const targetNotif = useNotifStore.getState().notifs.find((notif) => notif.notifId === notifId)

    if (!targetNotif || targetNotif.isRead) return

    const removedNotif = useNotifStore.getState().beginNotifRead(notifId)
    if (!removedNotif) return

    try {
      const response = await markNotifAsReadAction(notifId)
      assertNotifActionSuccess(response, '알림을 읽음 처리하지 못했습니다.')
    } catch (error) {
      if (isCurrentNotifSession(session.sessionKey, session.generation)) {
        useNotifStore.getState().rollbackNotifRead(removedNotif)
        resyncIfPendingSettled(session)
      }

      throw error
    }

    if (!isCurrentNotifSession(session.sessionKey, session.generation)) return

    useNotifStore.getState().confirmNotifRead(notifId)
    resyncIfPendingSettled(session)
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

    const snapshot = useNotifStore.getState().beginAllNotifsRead()
    if (!snapshot) return

    try {
      const response = await markAllNotifsAsReadAction()
      assertNotifActionSuccess(response, '알림을 모두 읽음 처리하지 못했습니다.')
    } catch (error) {
      if (isCurrentNotifSession(session.sessionKey, session.generation)) {
        useNotifStore.getState().rollbackAllNotifsRead(snapshot)
        resyncIfPendingSettled(session)
      }

      throw error
    }

    if (!isCurrentNotifSession(session.sessionKey, session.generation)) return

    useNotifStore.getState().confirmAllNotifsRead(snapshot)
    resyncIfPendingSettled(session)
  }, [])

  return useMemo(
    () => ({
      fetchInitialNotifs,
      fetchMoreNotifs,
      receiveNotif,
      markAsRead,
      markProcessingAsRead,
      markAllAsRead,
    }),
    [
      fetchInitialNotifs,
      fetchMoreNotifs,
      markAllAsRead,
      markAsRead,
      markProcessingAsRead,
      receiveNotif,
    ],
  )
}
