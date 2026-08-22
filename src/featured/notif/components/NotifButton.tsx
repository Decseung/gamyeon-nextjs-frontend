'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/shared/ui/dropdown-menu'
import { useNotifActions } from '../hooks/useNotifActions'
import { USE_NOTIF_MOCK, useNotifMockStore } from '../mock'
import { useNotifStore } from '../store'
import type { Notif } from '../types'
import { NotifList } from './NotifList'

export function NotifButton() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const notifs = useNotifStore((state) => state.notifs)
  const unreadCount = useNotifStore((state) => state.unreadCount)
  const hasMore = useNotifStore((state) => state.hasMore)
  const isLoading = useNotifStore((state) => state.isLoading)
  const isLoadingMore = useNotifStore((state) => state.isLoadingMore)
  const { fetchMoreNotifs, markAsRead, markProcessingAsRead, markAllAsRead } = useNotifActions()
  const mockNotifs = useNotifMockStore((state) => state.notifs)
  const removeMockNotif = useNotifMockStore((state) => state.removeNotif)
  const markMockNotifAsRead = useNotifMockStore((state) => state.markNotifAsRead)
  const markAllMockNotifsAsRead = useNotifMockStore((state) => state.markAllNotifsAsRead)

  const visibleNotifs = USE_NOTIF_MOCK ? mockNotifs : notifs
  const visibleUnreadCount = USE_NOTIF_MOCK
    ? mockNotifs.filter((notif) => !notif.isRead).length
    : unreadCount
  const visibleHasMore = USE_NOTIF_MOCK ? false : hasMore
  const visibleIsLoading = USE_NOTIF_MOCK ? false : isLoading
  const visibleIsLoadingMore = USE_NOTIF_MOCK ? false : isLoadingMore

  const handleMarkAllAsRead = () => {
    if (USE_NOTIF_MOCK) {
      markAllMockNotifsAsRead()
      return
    }

    void markAllAsRead().catch((error: unknown) => {
      console.error('알림을 모두 읽음 처리하지 못했습니다.', error)
    })
  }

  const handleNotifClick = (notif: Notif) => {
    if (notif.notifType === 'REPORT_PROCESSING') {
      if (notif.isRead) return

      if (USE_NOTIF_MOCK) {
        markMockNotifAsRead(notif.notifId)
      } else {
        void markProcessingAsRead(notif.notifId).catch((error: unknown) => {
          console.error('알림을 읽음 처리하지 못했습니다.', error)
        })
      }
      return
    }

    setIsOpen(false)

    if (USE_NOTIF_MOCK) {
      removeMockNotif(notif.notifId)
    } else if (!notif.isRead) {
      void markAsRead(notif.notifId).catch((error: unknown) => {
        console.error('알림을 읽음 처리하지 못했습니다.', error)
      })
    }

    switch (notif.notifType) {
      case 'NOTICE':
        router.push(`/notices/${notif.targetId}`)
        break
      case 'REPORT_SUCCESS':
        router.push(`/report/${notif.targetId}`)
        break
      case 'REPORT_FAILED':
        router.push('/history')
        break
    }
  }

  const handleLoadMore = () => {
    if (USE_NOTIF_MOCK) return

    void fetchMoreNotifs().catch((error: unknown) => {
      console.error('알림을 추가로 불러오지 못했습니다.', error)
    })
  }

  return (
    <DropdownMenu modal={false} open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className="text-muted-foreground hover:bg-muted hover:text-foreground relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl transition-colors outline-none"
          aria-label="알림"
        >
          <Bell className="h-4.5 w-4.5" />
          {visibleUnreadCount > 0 && (
            <span className="bg-primary text-primary-foreground absolute top-0.5 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] leading-none font-bold">
              {visibleUnreadCount > 9 ? '9+' : visibleUnreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[calc(100vw-2rem)] max-w-88 p-0">
        <div className="border-border/50 flex items-center justify-between border-b px-4 py-3">
          <span className="text-sm font-semibold">알림</span>
          {visibleUnreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              className="text-muted-foreground hover:text-foreground cursor-pointer text-xs transition"
            >
              모두 읽음
            </button>
          )}
        </div>
        <NotifList
          notifs={visibleNotifs}
          hasMore={visibleHasMore}
          isLoading={visibleIsLoading}
          isLoadingMore={visibleIsLoadingMore}
          onNotifClick={handleNotifClick}
          onLoadMore={handleLoadMore}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
