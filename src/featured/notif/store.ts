import { create } from 'zustand'
import type { Notif, NotifListData, NotifState } from './types'

const initialNotifState = {
  notifs: [] as Notif[],
  unreadCount: 0,
  nextCursorId: null,
  hasMore: false,
  isLoading: false,
  isLoadingMore: false,
  mutationRevision: 0,
  pendingReadNotifIds: new Set<number>() as ReadonlySet<number>,
}

function mergeNotifsByCreatedAt(apiNotifs: Notif[], currentNotifs: Notif[]): Notif[] {
  const notifById = new Map(currentNotifs.map((notif) => [notif.notifId, notif]))

  for (const notif of apiNotifs) {
    notifById.set(notif.notifId, notif)
  }

  return Array.from(notifById.values()).sort((a, b) => {
    const createdAtDiff = Date.parse(b.createdAt) - Date.parse(a.createdAt)
    return createdAtDiff || b.notifId - a.notifId
  })
}

function excludePendingReadNotifs(
  notifs: Notif[],
  pendingReadNotifIds: ReadonlySet<number>,
): Notif[] {
  return notifs.filter((notif) => !pendingReadNotifIds.has(notif.notifId))
}

function getAdjustedUnreadCount(
  serverUnreadCount: number,
  currentUnreadCount: number,
  pendingReadNotifIds: ReadonlySet<number>,
): number {
  // 서버 전역 카운트가 pending 읽음을 이미 반영했는지는 현재 페이지 응답만으로 알 수 없다.
  // 낙관적 읽음이 끝날 때까지는 로컬 카운트를 유지해 이중 차감을 피한다.
  return pendingReadNotifIds.size > 0 ? currentUnreadCount : serverUnreadCount
}

/**
 * 알림 드롭다운과 SSE 수신 결과가 함께 사용하는 전역 상태.
 * 읽음 여부와 관계없이 불러온 목록을 최신순으로 유지하며,
 * 다음 페이지는 마지막 notifId를 cursorId로 요청한다.
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
    set((state) => {
      const settledApiNotifs = excludePendingReadNotifs(data.notifs, state.pendingReadNotifIds)
      const unreadCount = getAdjustedUnreadCount(
        data.unreadCount,
        state.unreadCount,
        state.pendingReadNotifIds,
      )

      return {
        notifs: mergeNotifsByCreatedAt(settledApiNotifs, state.notifs),
        unreadCount,
        nextCursorId: data.nextCursorId,
        hasMore: data.hasNext,
      }
    })
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
      const settledApiNotifs = excludePendingReadNotifs(data.notifs, state.pendingReadNotifIds)
      const unreadCount = getAdjustedUnreadCount(
        data.unreadCount,
        state.unreadCount,
        state.pendingReadNotifIds,
      )

      return {
        notifs: mergeNotifsByCreatedAt(settledApiNotifs, state.notifs),
        unreadCount,
        nextCursorId: data.nextCursorId,
        hasMore: data.hasNext,
      }
    })
  },

  prependNotif: (notif) => {
    set((state) => {
      if (
        state.pendingReadNotifIds.has(notif.notifId) ||
        state.notifs.some((currentNotif) => currentNotif.notifId === notif.notifId)
      ) {
        return {}
      }

      return {
        notifs: [notif, ...state.notifs],
        unreadCount: notif.isRead ? state.unreadCount : state.unreadCount + 1,
        nextCursorId: state.nextCursorId ?? notif.notifId,
        mutationRevision: state.mutationRevision + 1,
      }
    })
  },

  beginNotifRead: (notifId) => {
    let removedNotif: Notif | null = null

    set((state) => {
      if (state.pendingReadNotifIds.has(notifId)) return {}

      const currentNotif = state.notifs.find((notif) => notif.notifId === notifId)

      if (!currentNotif || currentNotif.isRead) return {}

      removedNotif = currentNotif
      const pendingReadNotifIds = new Set(state.pendingReadNotifIds)
      pendingReadNotifIds.add(notifId)

      return {
        notifs: state.notifs.map((notif) =>
          notif.notifId === notifId ? { ...notif, isRead: true } : notif,
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
        pendingReadNotifIds,
        mutationRevision: state.mutationRevision + 1,
      }
    })

    return removedNotif
  },

  confirmNotifRead: (notifId) => {
    set((state) => {
      if (!state.pendingReadNotifIds.has(notifId)) return {}

      const pendingReadNotifIds = new Set(state.pendingReadNotifIds)
      pendingReadNotifIds.delete(notifId)

      return {
        pendingReadNotifIds,
        mutationRevision: state.mutationRevision + 1,
      }
    })
  },

  rollbackNotifRead: (notif) => {
    set((state) => {
      if (!state.pendingReadNotifIds.has(notif.notifId)) return {}

      const pendingReadNotifIds = new Set(state.pendingReadNotifIds)
      pendingReadNotifIds.delete(notif.notifId)

      return {
        notifs: mergeNotifsByCreatedAt([notif], state.notifs),
        unreadCount: notif.isRead ? state.unreadCount : state.unreadCount + 1,
        pendingReadNotifIds,
        mutationRevision: state.mutationRevision + 1,
      }
    })
  },

  markNotifAsReadInPlace: (notifId) => {
    set((state) => {
      const currentNotif = state.notifs.find((notif) => notif.notifId === notifId)

      if (!currentNotif || currentNotif.isRead) return {}

      return {
        notifs: state.notifs.map((notif) =>
          notif.notifId === notifId ? { ...notif, isRead: true } : notif,
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
        mutationRevision: state.mutationRevision + 1,
      }
    })
  },

  removeNotifsAsRead: (snapshot) => {
    set((state) => {
      const snapshotNotifIds = new Set(snapshot.notifIds)
      const unresolvedSnapshotCount = state.notifs.filter(
        (notif) => snapshotNotifIds.has(notif.notifId) && !notif.isRead,
      ).length
      const alreadyReadSnapshotCount = Math.max(
        0,
        snapshot.notifIds.length - unresolvedSnapshotCount,
      )
      const unreadCountToRemove = Math.max(0, snapshot.unreadCount - alreadyReadSnapshotCount)
      const nextUnreadCount = Math.max(0, state.unreadCount - unreadCountToRemove)
      const pendingReadNotifIds = new Set(state.pendingReadNotifIds)

      for (const notifId of snapshotNotifIds) {
        pendingReadNotifIds.delete(notifId)
      }

      for (const notifId of snapshot.pendingReadNotifIds) {
        pendingReadNotifIds.delete(notifId)
      }

      return {
        notifs: state.notifs.map((notif) =>
          snapshotNotifIds.has(notif.notifId) ? { ...notif, isRead: true } : notif,
        ),
        unreadCount: nextUnreadCount,
        hasMore: state.hasMore,
        pendingReadNotifIds,
        mutationRevision: state.mutationRevision + 1,
      }
    })
  },

  resetNotifs: () => set(initialNotifState),
}))
