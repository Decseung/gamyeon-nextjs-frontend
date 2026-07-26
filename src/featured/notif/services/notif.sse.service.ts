import { EventStreamContentType, fetchEventSource } from '@microsoft/fetch-event-source'
import type { Notif } from '../types'

const NOTIF_SUBSCRIBE_ENDPOINT = '/api/v1/notifs/subscribe'
const RECONNECT_INTERVAL_MS = 3000

class FatalSseError extends Error {}

export interface SubscribeNotifsOptions {
  accessToken: string
  onConnected?: () => void
  onNotif: (notif: Notif) => void
  onUnauthorized?: () => void
}

let activeController: AbortController | null = null

function getSubscribeUrl(): string {
  const baseUrl = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '')
  return `${baseUrl}${NOTIF_SUBSCRIBE_ENDPOINT}`
}

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

/**
 * 현재 사용자의 실시간 알림 스트림을 구독한다.
 * 반환된 cleanup 함수를 호출하면 현재 연결과 예약된 재연결을 모두 종료한다.
 */
export function subscribeNotifs({
  accessToken,
  onConnected,
  onNotif,
  onUnauthorized,
}: SubscribeNotifsOptions): () => void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return () => undefined
  }

  activeController?.abort()

  const controller = new AbortController()
  activeController = controller

  let hasConnectedForCurrentConnection = false
  let hasHandledUnauthorized = false

  const cleanup = () => {
    if (!controller.signal.aborted) {
      controller.abort()
    }

    if (activeController === controller) {
      activeController = null
    }
  }

  void fetchEventSource(getSubscribeUrl(), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      accept: EventStreamContentType,
    },
    signal: controller.signal,
    openWhenHidden: true,
    async onopen(response) {
      if (controller.signal.aborted) return

      if (response.status === 401) {
        cleanup()

        if (!hasHandledUnauthorized) {
          hasHandledUnauthorized = true
          onUnauthorized?.()
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

      hasConnectedForCurrentConnection = false
    },
    onmessage(event) {
      if (controller.signal.aborted) return

      if (event.event === 'connect') {
        if (event.data === 'connected' && !hasConnectedForCurrentConnection) {
          hasConnectedForCurrentConnection = true
          onConnected?.()
        }
        return
      }

      if (event.event === 'ping') return
      if (event.event !== 'notif') return

      let parsed: unknown
      try {
        parsed = JSON.parse(event.data)
      } catch (error) {
        console.error('알림 SSE 데이터를 파싱하지 못했습니다.', error)
        return
      }

      if (!isNotif(parsed)) {
        console.error('유효하지 않은 알림 SSE 데이터입니다.', parsed)
        return
      }

      onNotif(parsed)
    },
    onclose() {
      if (!controller.signal.aborted) {
        throw new Error('알림 SSE 연결이 종료되었습니다.')
      }
    },
    onerror(error: unknown) {
      if (controller.signal.aborted) return
      if (error instanceof FatalSseError) throw error
      return RECONNECT_INTERVAL_MS
    },
  })
    .catch((error: unknown) => {
      if (!controller.signal.aborted) {
        console.error('알림 SSE 구독 중 복구할 수 없는 오류가 발생했습니다.', error)
      }
    })
    .finally(() => {
      if (activeController === controller) {
        activeController = null
      }
    })

  return cleanup
}
