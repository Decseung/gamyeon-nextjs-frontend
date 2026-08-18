/** 알림의 종류. 백엔드 NotificationType enum과 동일한 값만 사용한다. */
export type NotifType = 'NOTICE' | 'REPORT_PROCESSING' | 'REPORT_SUCCESS' | 'REPORT_FAILED'

/** 목 알림 UI에서 사용하는 알림 데이터 형태. */
export interface Notif {
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
