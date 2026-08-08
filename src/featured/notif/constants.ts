import type { Notif } from './types'

export const NOTIF_LIST_SCROLL = 5

export const MOCK_NOTIFS = [
  {
    notifId: 105,
    notifType: 'REPORT_PROCESSING',
    title: '면접 분석 중',
    content: '2026.08.08 프론트엔드 개발자 면접을 분석하고 있어요.',
    targetId: 205,
    isRead: false,
    createdAt: '2026-08-08T14:35:00+09:00',
  },
  {
    notifId: 104,
    notifType: 'REPORT_SUCCESS',
    title: '면접 분석 완료',
    content: '2026.08.08 백엔드 개발자 면접 분석이 완료됐어요.',
    targetId: 173,
    isRead: false,
    createdAt: '2026-08-08T13:30:00+09:00',
  },
  {
    notifId: 103,
    notifType: 'REPORT_FAILED',
    title: '면접 분석 실패',
    content: '2026.08.07 풀스택 개발자 면접 분석에 실패했어요.',
    targetId: 203,
    isRead: false,
    createdAt: '2026-08-07T18:20:00+09:00',
  },
  {
    notifId: 102,
    notifType: 'NOTICE',
    title: '공지사항',
    content: '가면 서비스 업데이트 안내 (v1.2.0)',
    targetId: 52,
    isRead: true,
    createdAt: '2026-08-06T10:00:00+09:00',
  },
  {
    notifId: 101,
    notifType: 'REPORT_SUCCESS',
    title: '면접 분석 완료',
    content: '2026.08.05 프론트엔드 개발자 면접 분석이 완료됐어요.',
    targetId: 173,
    isRead: true,
    createdAt: '2026-08-05T16:00:00+09:00',
  },
  {
    notifId: 100,
    notifType: 'NOTICE',
    title: '공지사항',
    content: '가면 서비스 점검 안내입니다.',
    targetId: 51,
    isRead: true,
    createdAt: '2026-08-04T09:00:00+09:00',
  },
] satisfies Notif[]
