'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/shared/ui/dropdown-menu'
import { useNotifActions } from '../hooks/useNotifActions'
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
  const isMarkingAllAsRead = useNotifStore((state) => state.isMarkingAllAsRead)
  const { fetchMoreNotifs, markAsRead, markProcessingAsRead, markAllAsRead } = useNotifActions()
  const badgeClassName =
    unreadCount > 99
      ? 'top-0 right-0 h-5 w-5 text-[8px]'
      : unreadCount > 9
        ? 'top-0 right-0 h-5 w-5 text-[9px]'
        : 'top-0.5 right-0.5 h-4 w-4 text-[10px]'

  const handleMarkAllAsRead = () => {
    if (isMarkingAllAsRead) return

    void markAllAsRead().catch((error: unknown) => {
      console.error('알림을 모두 읽음 처리하지 못했습니다.', error)
    })
  }

  const handleNotifClick = (notif: Notif) => {
    if (notif.notifType === 'REPORT_PROCESSING') {
      if (notif.isRead) return

      void markProcessingAsRead(notif.notifId).catch((error: unknown) => {
        console.error('알림을 읽음 처리하지 못했습니다.', error)
      })
      return
    }

    setIsOpen(false)

    if (!notif.isRead) {
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
          {unreadCount > 0 && (
            <span
              className={`bg-primary text-primary-foreground absolute flex items-center justify-center rounded-full leading-none font-bold tabular-nums ${badgeClassName}`}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="flex w-[calc(100vw-2rem)] max-w-88 flex-col overflow-hidden p-0"
      >
        <div className="border-border/50 flex shrink-0 items-center justify-between border-b px-4 py-3">
          <span className="text-sm font-semibold">알림</span>
          {(unreadCount > 0 || isMarkingAllAsRead) && (
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              disabled={isMarkingAllAsRead}
              className="text-muted-foreground hover:text-foreground cursor-pointer text-xs transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isMarkingAllAsRead ? '처리 중...' : '모두 읽음'}
            </button>
          )}
        </div>
        <NotifList
          notifs={notifs}
          hasMore={hasMore}
          isLoading={isLoading}
          isLoadingMore={isLoadingMore}
          isMarkingAllAsRead={isMarkingAllAsRead}
          onNotifClick={handleNotifClick}
          onLoadMore={handleLoadMore}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
