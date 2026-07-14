/** 알림의 종류. 백엔드 NotificationType enum과 동일한 값만 사용한다. */
export type NotifType = 'NOTICE' | 'REPORT_PROCESSING' | 'REPORT_SUCCESS' | 'REPORT_FAILED'

/** 알림 목록과 SSE `notif` 이벤트에서 공통으로 사용하는 알림 데이터. */
export interface Notif {
  /** 알림 자체의 식별자. 다음 페이지 조회 시 cursorId로도 사용한다. */
  notifId: number
  notifType: NotifType
  title: string
  content: string
  /** NOTICE면 noticeId, 그 외 면접 알림이면 intvId다. */
  targetId: number
  isRead: boolean
  /** ISO 8601 형식의 생성 시각 */
  createdAt: string
}

/** GET /api/v1/notifs의 data 필드 */
export interface NotifListData {
  unreadCount: number
  notifs: Notif[]
}

/** 알림 목록의 커서 기반 조회 파라미터 */
export interface GetNotifsParams {
  /** 직전 페이지의 마지막 notifId. 처음 조회할 때는 생략한다. */
  cursorId?: number
  /** 한 번에 가져올 개수. 정책상 기본값은 5개다. */
  size?: number
}
