import { create } from 'zustand'
import {
  DEFAULT_NOTIF_PAGE_SIZE,
  getNotifs,
  markAllNotifsAsRead,
  markNotifAsRead,
} from './services/notif.service'
import type { Notif, NotifState } from './types'

const initialNotifState = {
  notifs: [] as Notif[],
  unreadCount: 0,
  nextCursorId: null,
  hasMore: true,
  isLoading: false,
  isLoadingMore: false,
}

/**
 * 알림 드롭다운과 SSE 수신 결과가 함께 사용하는 전역 상태.
 * 목록은 최신순으로 유지하며, 다음 페이지는 마지막 notifId를 cursorId로 요청한다.
 */
export const useNotifStore = create<NotifState>((set, get) => ({
  ...initialNotifState,

  fetchInitialNotifs: async () => {
    if (get().isLoading) return

    set({ isLoading: true })

    try {
      const response = await getNotifs()
      const data = response.data
      const notifs = data?.notifs ?? []

      set({
        notifs,
        unreadCount: data?.unreadCount ?? 0,
        nextCursorId: notifs.at(-1)?.notifId ?? null,
        hasMore: data?.hasNext ?? notifs.length === DEFAULT_NOTIF_PAGE_SIZE,
        isLoading: false,
        isLoadingMore: false,
      })
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  fetchMoreNotifs: async () => {
    const { hasMore, isLoading, isLoadingMore, nextCursorId } = get()

    if (!hasMore || isLoading || isLoadingMore || nextCursorId === null) return

    set({ isLoadingMore: true })

    try {
      const response = await getNotifs({ cursorId: nextCursorId })
      const data = response.data
      const incomingNotifs = data?.notifs ?? []

      set((state) => {
        const existingIds = new Set(state.notifs.map((notif) => notif.notifId))
        const uniqueNotifs = incomingNotifs.filter((notif) => !existingIds.has(notif.notifId))
        const mergedNotifs = [...state.notifs, ...uniqueNotifs]

        return {
          notifs: mergedNotifs,
          nextCursorId: incomingNotifs.at(-1)?.notifId ?? state.nextCursorId,
          hasMore: data?.hasNext ?? incomingNotifs.length === DEFAULT_NOTIF_PAGE_SIZE,
          isLoadingMore: false,
        }
      })
    } catch (error) {
      set({ isLoadingMore: false })
      throw error
    }
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

  markAsRead: async (notifId) => {
    const targetNotif = get().notifs.find((notif) => notif.notifId === notifId)

    if (!targetNotif || targetNotif.isRead) return

    await markNotifAsRead(notifId)

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

  markAllAsRead: async () => {
    await markAllNotifsAsRead()

    set((state) => ({
      notifs: state.notifs.map((notif) => ({ ...notif, isRead: true })),
      unreadCount: 0,
    }))
  },

  resetNotifs: () => set(initialNotifState),
}))
