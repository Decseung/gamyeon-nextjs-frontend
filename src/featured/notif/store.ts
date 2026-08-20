import { create } from 'zustand'
import type { Notif, NotifListData, NotifState } from './types'

const initialNotifState = {
  notifs: [] as Notif[],
  unreadCount: 0,
  nextCursorId: null,
  hasMore: true,
  isLoading: false,
  isLoadingMore: false,
}

function mergeNotifsByCreatedAt(apiNotifs: Notif[], currentNotifs: Notif[]): Notif[] {
  const notifById = new Map(apiNotifs.map((notif) => [notif.notifId, notif]))

  for (const notif of currentNotifs) {
    notifById.set(notif.notifId, notif)
  }

  return Array.from(notifById.values()).sort((a, b) => {
    const createdAtDiff = Date.parse(b.createdAt) - Date.parse(a.createdAt)
    return createdAtDiff || b.notifId - a.notifId
  })
}

/**
 * 알림 드롭다운과 SSE 수신 결과가 함께 사용하는 전역 상태.
 * 목록은 최신순으로 유지하며, 다음 페이지는 마지막 notifId를 cursorId로 요청한다.
 */
export const useNotifStore = create<NotifState>((set, get) => ({
  ...initialNotifState,

  beginInitialLoad: () => {
    if (get().isLoading) return false

    set({ isLoading: true })
    return true
  },

  finishInitialLoad: () => set({ isLoading: false }),

  applyInitialNotifs: (data: NotifListData) => {
    set((state) => ({
      notifs: mergeNotifsByCreatedAt(data.notifs, state.notifs),
      unreadCount: data.unreadCount,
      nextCursorId: data.notifs.at(-1)?.notifId ?? null,
      hasMore: data.hasNext ?? false,
    }))
  },

  beginMoreLoad: () => {
    const { hasMore, isLoading, isLoadingMore, nextCursorId } = get()

    if (!hasMore || isLoading || isLoadingMore || nextCursorId === null) return null

    set({ isLoadingMore: true })
    return nextCursorId
  },

  finishMoreLoad: () => set({ isLoadingMore: false }),

  appendNotifs: (data: NotifListData) => {
    set((state) => {
      const existingIds = new Set(state.notifs.map((notif) => notif.notifId))
      const uniqueNotifs = data.notifs.filter((notif) => !existingIds.has(notif.notifId))

      return {
        notifs: [...state.notifs, ...uniqueNotifs],
        nextCursorId: data.notifs.at(-1)?.notifId ?? state.nextCursorId,
        hasMore: data.hasNext ?? false,
      }
    })
  },

  prependNotif: (notif) => {
    set((state) => {
      if (state.notifs.some((currentNotif) => currentNotif.notifId === notif.notifId)) {
        return {}
      }

      return {
        notifs: [notif, ...state.notifs],
        unreadCount: notif.isRead ? state.unreadCount : state.unreadCount + 1,
        nextCursorId: state.nextCursorId ?? notif.notifId,
      }
    })
  },

  markNotifAsRead: (notifId) => {
    set((state) => {
      const currentNotif = state.notifs.find((notif) => notif.notifId === notifId)

      if (!currentNotif || currentNotif.isRead) return {}

      return {
        notifs: state.notifs.map((notif) =>
          notif.notifId === notifId ? { ...notif, isRead: true } : notif,
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }
    })
  },

  markAllNotifsAsRead: () => {
    set((state) => ({
      notifs: state.notifs.map((notif) => ({ ...notif, isRead: true })),
      unreadCount: 0,
    }))
  },

  resetNotifs: () => set(initialNotifState),
}))
