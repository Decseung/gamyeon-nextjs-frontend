import type { Notif, NotifListData } from '../types'

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

/** UI 표시 여부와 무관하게 페이지네이션 커서로 사용할 수 있는 ID를 추출한다. */
export function getNotifCursorId(value: unknown): number | null {
  if (!isRecord(value)) return null

  const { notifId } = value
  return typeof notifId === 'number' && Number.isSafeInteger(notifId) && notifId > 0
    ? notifId
    : null
}

/**
 * 알림 데이터의 구조와 타입을 검증한다.
 * notifId와 targetId는 0보다 큰 안전정수여야 하고, createdAt은 ISO 8601 형식 문자열이어야 한다.
 */
export function isNotif(value: unknown): value is Notif {
  if (!isRecord(value)) return false

  return (
    getNotifCursorId(value) !== null &&
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

/** 서버 원본 페이지와 UI에 전달할 알림을 분리해 정규화한다. */
export function normalizeNotifListData(value: unknown, limit: number): NotifListData | null {
  if (!isValidNotifListShape(value)) return null

  const rawNotifs = value.notifs
  const hasNext = value.hasNext ?? rawNotifs.length === limit
  const nextCursorId = getNotifCursorId(rawNotifs.at(-1))

  if (hasNext && nextCursorId === null) return null

  return {
    unreadCount: value.unreadCount,
    notifs: sanitizeNotifs(rawNotifs),
    hasNext,
    nextCursorId,
  }
}
