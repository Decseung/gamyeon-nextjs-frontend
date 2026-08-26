import { create } from 'zustand'
import type { Notif, NotifListData, NotifReadAllSnapshot, NotifState } from './types'

const initialNotifState = {
  notifs: [] as Notif[],
  unreadCount: 0,
  nextCursorId: null,
  hasMore: false,
  isLoading: false,
  isLoadingMore: false,
  isMarkingAllAsRead: false,
  mutationRevision: 0,
  pendingReadNotifIds: new Set<number>() as ReadonlySet<number>,
  suppressedProcessingNotifIds: new Set<number>() as ReadonlySet<number>,
  unsyncedSuppressedNotifIds: new Set<number>() as ReadonlySet<number>,
}

interface ReconciledNotifs {
  notifs: Notif[]
  suppressedProcessingNotifIds: ReadonlySet<number>
  unsyncedSuppressedNotifIds: ReadonlySet<number>
  newlyUnsyncedNotifIds: number[]
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

function reconcileReportNotifs(
  notifs: Notif[],
  currentSuppressedProcessingNotifIds: ReadonlySet<number>,
  currentUnsyncedSuppressedNotifIds: ReadonlySet<number>,
): ReconciledNotifs {
  const terminalTargetIds = new Set<number>()

  for (const notif of notifs) {
    if (notif.notifType === 'REPORT_SUCCESS' || notif.notifType === 'REPORT_FAILED') {
      terminalTargetIds.add(notif.targetId)
    }
  }

  if (terminalTargetIds.size === 0) {
    return {
      notifs,
      suppressedProcessingNotifIds: currentSuppressedProcessingNotifIds,
      unsyncedSuppressedNotifIds: currentUnsyncedSuppressedNotifIds,
      newlyUnsyncedNotifIds: [],
    }
  }

  const suppressedProcessingNotifIds = new Set(currentSuppressedProcessingNotifIds)
  const unsyncedSuppressedNotifIds = new Set(currentUnsyncedSuppressedNotifIds)
  const newlyUnsyncedNotifIds: number[] = []
  const reconciledNotifs: Notif[] = []

  for (const notif of notifs) {
    const isSupersededProcessingNotif =
      notif.notifType === 'REPORT_PROCESSING' && terminalTargetIds.has(notif.targetId)

    if (!isSupersededProcessingNotif) {
      reconciledNotifs.push(notif)
      continue
    }

    suppressedProcessingNotifIds.add(notif.notifId)

    if (notif.isRead) {
      unsyncedSuppressedNotifIds.delete(notif.notifId)
      continue
    }

    if (!unsyncedSuppressedNotifIds.has(notif.notifId)) {
      unsyncedSuppressedNotifIds.add(notif.notifId)
      newlyUnsyncedNotifIds.push(notif.notifId)
    }
  }

  return {
    notifs: reconciledNotifs,
    suppressedProcessingNotifIds,
    unsyncedSuppressedNotifIds,
    newlyUnsyncedNotifIds,
  }
}

function excludePendingReadNotifs(
  notifs: Notif[],
  pendingReadNotifIds: ReadonlySet<number>,
): Notif[] {
  return notifs.filter((notif) => !pendingReadNotifIds.has(notif.notifId))
}

function getReconciledUnreadCount(
  serverUnreadCount: number,
  currentUnreadCount: number,
  pendingReadNotifIds: ReadonlySet<number>,
  isMarkingAllAsRead: boolean,
  unsyncedSuppressedCount: number,
  newlyUnsyncedCount: number,
): number {
  // 서버 전역 카운트가 pending 읽음을 이미 반영했는지는 현재 페이지 응답만으로 알 수 없다.
  // 낙관적 읽음이 끝날 때까지는 로컬 카운트를 유지해 이중 차감을 피한다.
  if (pendingReadNotifIds.size > 0 || isMarkingAllAsRead) {
    return Math.max(0, currentUnreadCount - newlyUnsyncedCount)
  }

  return Math.max(0, serverUnreadCount - unsyncedSuppressedCount)
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
    let newlyUnsyncedNotifIds: number[] = []

    set((state) => {
      // An initial response started before the all-read transaction may still contain
      // unread notifications. Defer the entire response until the post-mutation resync.
      if (state.isMarkingAllAsRead) return {}

      const settledApiNotifs = excludePendingReadNotifs(data.notifs, state.pendingReadNotifIds)
      const reconciled = reconcileReportNotifs(
        mergeNotifsByCreatedAt(settledApiNotifs, state.notifs),
        state.suppressedProcessingNotifIds,
        state.unsyncedSuppressedNotifIds,
      )
      newlyUnsyncedNotifIds = reconciled.newlyUnsyncedNotifIds
      const unreadCount = getReconciledUnreadCount(
        data.unreadCount,
        state.unreadCount,
        state.pendingReadNotifIds,
        state.isMarkingAllAsRead,
        reconciled.unsyncedSuppressedNotifIds.size,
        newlyUnsyncedNotifIds.length,
      )

      return {
        notifs: reconciled.notifs,
        unreadCount,
        nextCursorId: data.nextCursorId,
        hasMore: data.hasNext,
        suppressedProcessingNotifIds: reconciled.suppressedProcessingNotifIds,
        unsyncedSuppressedNotifIds: reconciled.unsyncedSuppressedNotifIds,
        ...(newlyUnsyncedNotifIds.length > 0 && {
          mutationRevision: state.mutationRevision + 1,
        }),
      }
    })

    return newlyUnsyncedNotifIds
  },

  beginMoreLoad: () => {
    const { hasMore, isLoading, isLoadingMore, isMarkingAllAsRead, nextCursorId } = get()

    if (!hasMore || isLoading || isLoadingMore || isMarkingAllAsRead || nextCursorId === null) {
      return null
    }

    set({ isLoadingMore: true })
    return nextCursorId
  },

  finishMoreLoad: () => set({ isLoadingMore: false }),

  appendNotifs: (data: NotifListData) => {
    let newlyUnsyncedNotifIds: number[] = []

    set((state) => {
      if (state.isMarkingAllAsRead) return {}

      const settledApiNotifs = excludePendingReadNotifs(data.notifs, state.pendingReadNotifIds)
      const reconciled = reconcileReportNotifs(
        mergeNotifsByCreatedAt(settledApiNotifs, state.notifs),
        state.suppressedProcessingNotifIds,
        state.unsyncedSuppressedNotifIds,
      )
      newlyUnsyncedNotifIds = reconciled.newlyUnsyncedNotifIds
      const unreadCount = getReconciledUnreadCount(
        data.unreadCount,
        state.unreadCount,
        state.pendingReadNotifIds,
        state.isMarkingAllAsRead,
        reconciled.unsyncedSuppressedNotifIds.size,
        newlyUnsyncedNotifIds.length,
      )

      return {
        notifs: reconciled.notifs,
        unreadCount,
        nextCursorId: data.nextCursorId,
        hasMore: data.hasNext,
        suppressedProcessingNotifIds: reconciled.suppressedProcessingNotifIds,
        unsyncedSuppressedNotifIds: reconciled.unsyncedSuppressedNotifIds,
        ...(newlyUnsyncedNotifIds.length > 0 && {
          mutationRevision: state.mutationRevision + 1,
        }),
      }
    })

    return newlyUnsyncedNotifIds
  },

  prependNotif: (notif) => {
    let newlyUnsyncedNotifIds: number[] = []

    set((state) => {
      if (
        state.pendingReadNotifIds.has(notif.notifId) ||
        state.suppressedProcessingNotifIds.has(notif.notifId) ||
        state.notifs.some((currentNotif) => currentNotif.notifId === notif.notifId)
      ) {
        return {}
      }

      const reconciled = reconcileReportNotifs(
        mergeNotifsByCreatedAt([notif], state.notifs),
        state.suppressedProcessingNotifIds,
        state.unsyncedSuppressedNotifIds,
      )
      newlyUnsyncedNotifIds = reconciled.newlyUnsyncedNotifIds

      return {
        notifs: reconciled.notifs,
        unreadCount: Math.max(
          0,
          state.unreadCount + (notif.isRead ? 0 : 1) - newlyUnsyncedNotifIds.length,
        ),
        nextCursorId: state.nextCursorId ?? notif.notifId,
        mutationRevision: state.mutationRevision + 1,
        suppressedProcessingNotifIds: reconciled.suppressedProcessingNotifIds,
        unsyncedSuppressedNotifIds: reconciled.unsyncedSuppressedNotifIds,
      }
    })

    return newlyUnsyncedNotifIds
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

      if (!currentNotif) {
        if (!state.unsyncedSuppressedNotifIds.has(notifId)) return {}

        const unsyncedSuppressedNotifIds = new Set(state.unsyncedSuppressedNotifIds)
        unsyncedSuppressedNotifIds.delete(notifId)

        return {
          unsyncedSuppressedNotifIds,
          mutationRevision: state.mutationRevision + 1,
        }
      }

      if (currentNotif.isRead) return {}

      return {
        notifs: state.notifs.map((notif) =>
          notif.notifId === notifId ? { ...notif, isRead: true } : notif,
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
        mutationRevision: state.mutationRevision + 1,
      }
    })
  },

  confirmSuppressedNotifRead: (notifId) => {
    set((state) => {
      if (!state.unsyncedSuppressedNotifIds.has(notifId)) return {}

      const unsyncedSuppressedNotifIds = new Set(state.unsyncedSuppressedNotifIds)
      unsyncedSuppressedNotifIds.delete(notifId)

      return {
        unsyncedSuppressedNotifIds,
        mutationRevision: state.mutationRevision + 1,
      }
    })
  },

  beginAllNotifsRead: () => {
    let snapshot: NotifReadAllSnapshot | null = null

    set((state) => {
      if (state.isMarkingAllAsRead) return {}

      const unreadNotifIds = state.notifs
        .filter((notif) => !notif.isRead)
        .map((notif) => notif.notifId)
      snapshot = {
        unreadNotifIds,
        pendingReadNotifIds: Array.from(state.pendingReadNotifIds),
        unsyncedSuppressedNotifIds: Array.from(state.unsyncedSuppressedNotifIds),
        unreadCount: state.unreadCount,
      }

      const pendingReadNotifIds = new Set(state.pendingReadNotifIds)
      for (const notifId of unreadNotifIds) {
        pendingReadNotifIds.add(notifId)
      }

      return {
        notifs: state.notifs.map((notif) => (notif.isRead ? notif : { ...notif, isRead: true })),
        unreadCount: 0,
        pendingReadNotifIds,
        isMarkingAllAsRead: true,
        mutationRevision: state.mutationRevision + 1,
      }
    })

    return snapshot
  },

  confirmAllNotifsRead: (snapshot) => {
    set((state) => {
      if (!state.isMarkingAllAsRead) return {}

      const transactionNotifIds = new Set([
        ...snapshot.unreadNotifIds,
        ...snapshot.pendingReadNotifIds,
      ])
      const unresolvedTransactionCount = state.notifs.filter(
        (notif) => transactionNotifIds.has(notif.notifId) && !notif.isRead,
      ).length
      const pendingReadNotifIds = new Set(state.pendingReadNotifIds)
      const unsyncedSuppressedNotifIds = new Set(state.unsyncedSuppressedNotifIds)

      for (const notifId of transactionNotifIds) {
        pendingReadNotifIds.delete(notifId)
      }

      for (const notifId of snapshot.unsyncedSuppressedNotifIds) {
        unsyncedSuppressedNotifIds.delete(notifId)
      }

      return {
        notifs: state.notifs.map((notif) =>
          transactionNotifIds.has(notif.notifId) ? { ...notif, isRead: true } : notif,
        ),
        unreadCount: Math.max(0, state.unreadCount - unresolvedTransactionCount),
        pendingReadNotifIds,
        unsyncedSuppressedNotifIds,
        isMarkingAllAsRead: false,
        mutationRevision: state.mutationRevision + 1,
      }
    })
  },

  rollbackAllNotifsRead: (snapshot) => {
    set((state) => {
      if (!state.isMarkingAllAsRead) return {}

      const unreadNotifIds = new Set(snapshot.unreadNotifIds)
      const pendingReadNotifIds = new Set(state.pendingReadNotifIds)

      // Keep reads that were already pending before the all-read transaction.
      // Only IDs added by beginAllNotifsRead belong to this rollback.
      for (const notifId of unreadNotifIds) {
        pendingReadNotifIds.delete(notifId)
      }

      return {
        notifs: state.notifs.map((notif) =>
          unreadNotifIds.has(notif.notifId) ? { ...notif, isRead: false } : notif,
        ),
        unreadCount: state.unreadCount + snapshot.unreadCount,
        pendingReadNotifIds,
        isMarkingAllAsRead: false,
        mutationRevision: state.mutationRevision + 1,
      }
    })
  },

  resetNotifs: () => set(initialNotifState),
}))
