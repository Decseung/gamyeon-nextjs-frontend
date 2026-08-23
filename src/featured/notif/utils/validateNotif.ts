import type { Notif } from '../types'

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

/**
 * 알림 데이터의 구조와 타입을 검증한다.
 * notifId와 targetId는 0보다 큰 안전정수여야 하고, createdAt은 ISO 8601 형식 문자열이어야 한다.
 */
export function isNotif(value: unknown): value is Notif {
  if (!isRecord(value)) return false

  return (
    typeof value.notifId === 'number' &&
    Number.isSafeInteger(value.notifId) &&
    value.notifId > 0 &&
    isNotifType(value.notifType) &&
    typeof value.title === 'string' &&
    typeof value.content === 'string' &&
    typeof value.targetId === 'number' &&
    Number.isSafeInteger(value.targetId) &&
    value.targetId > 0 &&
    typeof value.isRead === 'boolean' &&
    typeof value.createdAt === 'string' &&
    !Number.isNaN(Date.parse(value.createdAt))
  )
}

/** 배열에서 유효한 알림만 필터링하고 무효한 항목을 로그한다. */
export function sanitizeNotifs(notifs: unknown[]): Notif[] {
  const result: Notif[] = []

  for (const item of notifs) {
    if (isNotif(item)) {
      result.push(item)
    } else {
      console.error('유효하지 않은 알림 데이터를 건너뜁니다.', item)
    }
  }

  return result
}

/** 알림 목록 응답의 최상위 구조를 검증한다. */
export function isValidNotifListShape(
  value: unknown,
): value is { unreadCount: number; notifs: unknown[]; hasNext?: boolean } {
  if (!isRecord(value)) return false

  const { unreadCount, notifs, hasNext } = value

  return (
    typeof unreadCount === 'number' &&
    Number.isSafeInteger(unreadCount) &&
    unreadCount >= 0 &&
    Array.isArray(notifs) &&
    (hasNext === undefined || typeof hasNext === 'boolean')
  )
}
