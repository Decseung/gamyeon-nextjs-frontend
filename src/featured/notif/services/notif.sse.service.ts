import { EventStreamContentType, fetchEventSource } from '@microsoft/fetch-event-source'
import type { Notif } from '../types'

const NOTIF_SUBSCRIBE_ENDPOINT = '/api/notifs/subscribe'
const RECONNECT_INTERVAL_MS = 3000
const DISCONNECT_GRACE_MS = 300

class FatalSseError extends Error {}

export interface SubscribeNotifsOptions {
  sessionKey: string
  onConnected?: (isReconnect: boolean) => void
  onNotif: (notif: Notif) => void
  onUnauthorized?: () => void
}

type NotifSubscriber = SubscribeNotifsOptions

const subscribers = new Set<NotifSubscriber>()

let activeSessionKey: string | null = null
let activeController: AbortController | null = null
let disconnectTimer: ReturnType<typeof setTimeout> | null = null
let connectionGeneration = 0

function isNotifType(value: unknown): value is Notif['notifType'] {
  return (
    value === 'NOTICE' ||
    value === 'REPORT_PROCESSING' ||
    value === 'REPORT_SUCCESS' ||
    value === 'REPORT_FAILED'
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isNotif(value: unknown): value is Notif {
  if (!isRecord(value)) return false

  return (
    typeof value.notifId === 'number' &&
    Number.isFinite(value.notifId) &&
    isNotifType(value.notifType) &&
    typeof value.title === 'string' &&
    typeof value.content === 'string' &&
    typeof value.targetId === 'number' &&
    Number.isFinite(value.targetId) &&
    typeof value.isRead === 'boolean' &&
    typeof value.createdAt === 'string'
  )
}

function cancelScheduledDisconnect(): void {
  if (disconnectTimer === null) return

  clearTimeout(disconnectTimer)
  disconnectTimer = null
}

function isCurrentConnection(controller: AbortController, generation: number): boolean {
  return activeController === controller && connectionGeneration === generation
}

function stopConnection(clearSubscribers: boolean): void {
  cancelScheduledDisconnect()

  const controller = activeController
  activeController = null
  activeSessionKey = null

  if (clearSubscribers) {
    subscribers.clear()
  }

  if (controller && !controller.signal.aborted) {
    controller.abort()
  }
}

function dispatchToSubscribers(callback: (subscriber: NotifSubscriber) => void): void {
  for (const subscriber of Array.from(subscribers)) {
    try {
      callback(subscriber)
    } catch (error) {
      console.error('알림 SSE 구독자 콜백을 처리하지 못했습니다.', error)
    }
  }
}

function startConnection(): void {
  if (activeController || !activeSessionKey || subscribers.size === 0) return

  const controller = new AbortController()
  const generation = ++connectionGeneration
  let hasConnectedForCurrentRequest = false
  let hasConnectedOnce = false
  let hasHandledUnauthorized = false

  activeController = controller

  void fetchEventSource(NOTIF_SUBSCRIBE_ENDPOINT, {
    method: 'GET',
    credentials: 'same-origin',
    headers: {
      accept: EventStreamContentType,
    },
    signal: controller.signal,
    openWhenHidden: true,
    async onopen(response) {
      if (!isCurrentConnection(controller, generation) || controller.signal.aborted) return

      if (response.status === 401) {
        if (hasHandledUnauthorized) return

        hasHandledUnauthorized = true
        const unauthorizedSubscriber = Array.from(subscribers).find(
          (subscriber) => subscriber.onUnauthorized,
        )
        stopConnection(true)

        try {
          unauthorizedSubscriber?.onUnauthorized?.()
        } catch (error) {
          console.error('알림 SSE 인증 만료 처리를 수행하지 못했습니다.', error)
        }
        return
      }

      if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        throw new FatalSseError(`알림 SSE 연결이 거부되었습니다. (HTTP ${response.status})`)
      }

      const contentType = response.headers.get('content-type')
      if (!response.ok || !contentType?.startsWith(EventStreamContentType)) {
        throw new Error(`알림 SSE 연결에 실패했습니다. (HTTP ${response.status})`)
      }

      hasConnectedForCurrentRequest = false
    },
    onmessage(event) {
      if (!isCurrentConnection(controller, generation) || controller.signal.aborted) return

      if (event.event === 'connect') {
        if (event.data === 'connected' && !hasConnectedForCurrentRequest) {
          hasConnectedForCurrentRequest = true
          const isReconnect = hasConnectedOnce
          hasConnectedOnce = true
          dispatchToSubscribers((subscriber) => subscriber.onConnected?.(isReconnect))
        }
        return
      }

      if (event.event === 'ping' || event.event !== 'notif') return

      let parsed: unknown
      try {
        parsed = JSON.parse(event.data)
      } catch (error) {
        console.error('알림 SSE 데이터를 파싱하지 못했습니다.', error)
        return
      }

      if (!isNotif(parsed)) {
        console.error('유효하지 않은 알림 SSE 데이터입니다.')
        return
      }

      dispatchToSubscribers((subscriber) => subscriber.onNotif(parsed))
    },
    onclose() {
      if (isCurrentConnection(controller, generation) && !controller.signal.aborted) {
        throw new Error('알림 SSE 연결이 종료되었습니다.')
      }
    },
    onerror(error: unknown) {
      if (!isCurrentConnection(controller, generation) || controller.signal.aborted) return
      if (error instanceof FatalSseError) throw error
      return RECONNECT_INTERVAL_MS
    },
  })
    .catch((error: unknown) => {
      if (isCurrentConnection(controller, generation) && !controller.signal.aborted) {
        console.error('알림 SSE 구독 중 복구할 수 없는 오류가 발생했습니다.', error)
      }
    })
    .finally(() => {
      if (isCurrentConnection(controller, generation)) {
        activeController = null
      }
    })
}

function scheduleDisconnect(): void {
  if (subscribers.size > 0 || disconnectTimer !== null) return

  disconnectTimer = setTimeout(() => {
    disconnectTimer = null

    if (subscribers.size === 0) {
      stopConnection(false)
    }
  }, DISCONNECT_GRACE_MS)
}

/**
 * 같은 브라우저 탭의 동일 사용자 구독은 하나의 SSE 연결을 공유한다.
 * 마지막 구독 해제는 React Strict Mode의 즉시 재구독을 흡수하도록 잠시 유예한다.
 */
export function subscribeNotifs(options: SubscribeNotifsOptions): () => void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return () => undefined
  }

  cancelScheduledDisconnect()

  if (activeSessionKey && activeSessionKey !== options.sessionKey) {
    stopConnection(true)
  }

  activeSessionKey = options.sessionKey
  subscribers.add(options)
  startConnection()

  let isSubscribed = true

  return () => {
    if (!isSubscribed) return

    isSubscribed = false
    subscribers.delete(options)
    scheduleDisconnect()
  }
}

/** 로그아웃, 인증 만료, 사용자 변경처럼 기존 연결을 재사용하면 안 되는 경우 호출한다. */
export function disconnectNotifsImmediately(): void {
  stopConnection(true)
}
