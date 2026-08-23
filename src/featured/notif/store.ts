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

function shouldKeepNotif(notif: Notif): boolean {
  return !notif.isRead || notif.notifType === 'REPORT_PROCESSING'
}

function getUnreadPage(
  data: NotifListData,
  pendingReadNotifIds: ReadonlySet<number>,
): {
  unreadNotifs: Notif[]
  readNotifIds: Set<number>
  nextCursorId: number | null
} {
  const unreadNotifs: Notif[] = []
  const readNotifIds = new Set<number>()

  for (const notif of data.notifs) {
    if (notif.isRead) {
      readNotifIds.add(notif.notifId)
      if (notif.notifType === 'REPORT_PROCESSING') unreadNotifs.push(notif)
    } else if (!pendingReadNotifIds.has(notif.notifId)) {
      unreadNotifs.push(notif)
    }
  }

  return {
    unreadNotifs,
    readNotifIds,
    nextCursorId: data.notifs.at(-1)?.notifId ?? null,
  }
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
    set((state) => {
      const { unreadNotifs, readNotifIds, nextCursorId } = getUnreadPage(
        data,
        state.pendingReadNotifIds,
      )
      const currentUnreadNotifs = state.notifs.filter(
        (notif) =>
          shouldKeepNotif(notif) &&
          (!readNotifIds.has(notif.notifId) || notif.notifType === 'REPORT_PROCESSING') &&
          !state.pendingReadNotifIds.has(notif.notifId),
      )

      return {
        notifs: mergeNotifsByCreatedAt(unreadNotifs, currentUnreadNotifs),
        unreadCount: getAdjustedUnreadCount(
          data.unreadCount,
          state.unreadCount,
          state.pendingReadNotifIds,
        ),
        nextCursorId,
        hasMore: data.hasNext ?? false,
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
      const { unreadNotifs, readNotifIds, nextCursorId } = getUnreadPage(
        data,
        state.pendingReadNotifIds,
      )
      const currentUnreadNotifs = state.notifs.filter(
        (notif) =>
          shouldKeepNotif(notif) &&
          (!readNotifIds.has(notif.notifId) || notif.notifType === 'REPORT_PROCESSING') &&
          !state.pendingReadNotifIds.has(notif.notifId),
      )
      const existingIds = new Set(currentUnreadNotifs.map((notif) => notif.notifId))
      const uniqueNotifs = unreadNotifs.filter((notif) => !existingIds.has(notif.notifId))

      return {
        notifs: [...currentUnreadNotifs, ...uniqueNotifs],
        unreadCount: getAdjustedUnreadCount(
          data.unreadCount,
          state.unreadCount,
          state.pendingReadNotifIds,
        ),
        nextCursorId: nextCursorId ?? state.nextCursorId,
        hasMore: data.hasNext ?? false,
      }
    })
  },

  prependNotif: (notif) => {
    set((state) => {
      if (
        !shouldKeepNotif(notif) ||
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

      if (!currentNotif) return {}

      removedNotif = currentNotif
      const pendingReadNotifIds = new Set(state.pendingReadNotifIds)
      pendingReadNotifIds.add(notifId)

      return {
        notifs: state.notifs.filter((notif) => notif.notifId !== notifId),
        unreadCount: currentNotif.isRead ? state.unreadCount : Math.max(0, state.unreadCount - 1),
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
      const alreadyExists = state.notifs.some(
        (currentNotif) => currentNotif.notifId === notif.notifId,
      )

      return {
        notifs:
          notif.isRead || alreadyExists
            ? state.notifs
            : mergeNotifsByCreatedAt([notif], state.notifs),
        unreadCount: notif.isRead || alreadyExists ? state.unreadCount : state.unreadCount + 1,
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
      const presentSnapshotCount = state.notifs.filter((notif) =>
        snapshotNotifIds.has(notif.notifId),
      ).length
      const remainingNotifs = state.notifs.flatMap((notif) => {
        if (!snapshotNotifIds.has(notif.notifId)) return [notif]
        return notif.notifType === 'REPORT_PROCESSING' ? [{ ...notif, isRead: true }] : []
      })
      const alreadyRemovedSnapshotCount = Math.max(
        0,
        snapshot.notifIds.length - presentSnapshotCount,
      )
      const unreadCountToRemove = Math.max(0, snapshot.unreadCount - alreadyRemovedSnapshotCount)
      const pendingReadNotifIds = new Set(state.pendingReadNotifIds)

      for (const notifId of snapshotNotifIds) {
        pendingReadNotifIds.delete(notifId)
      }

      for (const notifId of snapshot.pendingReadNotifIds) {
        pendingReadNotifIds.delete(notifId)
      }

      const hasRemainingNotifs = remainingNotifs.length > 0

      return {
        notifs: remainingNotifs,
        unreadCount: Math.max(0, state.unreadCount - unreadCountToRemove),
        nextCursorId: hasRemainingNotifs ? state.nextCursorId : null,
        hasMore: hasRemainingNotifs ? state.hasMore : false,
        pendingReadNotifIds,
        mutationRevision: state.mutationRevision + 1,
      }
    })
  },

  resetNotifs: () => set(initialNotifState),
}))
