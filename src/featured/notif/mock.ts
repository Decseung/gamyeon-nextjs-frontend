import { create } from 'zustand'
import type { Notif } from './types'

// 상세 이동과 클릭 제거를 확인하기 위한 임시 목업. 테스트 후 false로 되돌린다.
export const USE_NOTIF_MOCK = true

const MOCK_NOTIFS = [
  {
    notifId: 900_009,
    notifType: 'NOTICE',
    title: '공지사항 테스트 알림',
    content: '9번 공지사항 상세 페이지 이동을 확인해주세요.',
    targetId: 9,
    isRead: false,
    createdAt: '2026-08-22T09:00:00+09:00',
  },
  {
    notifId: 900_107,
    notifType: 'REPORT_PROCESSING',
    title: '리포트를 분석하고 있어요',
    content: '106번 면접 리포트 분석 중 알림을 확인해주세요.',
    targetId: 106,
    isRead: false,
    createdAt: '2026-08-22T08:58:00+09:00',
  },
  {
    notifId: 900_106,
    notifType: 'REPORT_SUCCESS',
    title: '리포트 생성이 완료됐어요',
    content: '106번 리포트 상세 페이지 이동을 확인해주세요.',
    targetId: 106,
    isRead: false,
    createdAt: '2026-08-22T08:55:00+09:00',
  },
  {
    notifId: 900_108,
    notifType: 'REPORT_FAILED',
    title: '리포트 생성에 실패했어요',
    content: '106번 면접 리포트 실패 알림을 확인해주세요.',
    targetId: 106,
    isRead: false,
    createdAt: '2026-08-22T08:50:00+09:00',
  },
] satisfies Notif[]

interface NotifMockState {
  notifs: Notif[]
  removeNotif: (notifId: number) => void
  markNotifAsRead: (notifId: number) => void
  markAllNotifsAsRead: () => void
}

export const useNotifMockStore = create<NotifMockState>((set) => ({
  notifs: MOCK_NOTIFS,
  removeNotif: (notifId) =>
    set((state) => ({
      notifs: state.notifs.filter((notif) => notif.notifId !== notifId),
    })),
  markNotifAsRead: (notifId) =>
    set((state) => ({
      notifs: state.notifs.map((notif) =>
        notif.notifId === notifId ? { ...notif, isRead: true } : notif,
      ),
    })),
  markAllNotifsAsRead: () =>
    set((state) => ({
      notifs: state.notifs.flatMap((notif) =>
        notif.notifType === 'REPORT_PROCESSING' ? [{ ...notif, isRead: true }] : [],
      ),
    })),
}))
