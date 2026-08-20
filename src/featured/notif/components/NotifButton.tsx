'use client'

import { useRouter } from 'next/navigation'
import { Bell } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/shared/ui/dropdown-menu'
import { useNotifStore } from '../store'
import type { Notif } from '../types'
import { NotifList } from './NotifList'

export function NotifButton() {
  const router = useRouter()
  const notifs = useNotifStore((state) => state.notifs)
  const unreadCount = useNotifStore((state) => state.unreadCount)
  const hasMore = useNotifStore((state) => state.hasMore)
  const isLoading = useNotifStore((state) => state.isLoading)
  const isLoadingMore = useNotifStore((state) => state.isLoadingMore)
  const fetchMoreNotifs = useNotifStore((state) => state.fetchMoreNotifs)
  const markAsRead = useNotifStore((state) => state.markAsRead)
  const markAllAsRead = useNotifStore((state) => state.markAllAsRead)

  const handleMarkAllAsRead = () => {
    void markAllAsRead().catch((error: unknown) => {
      console.error('알림을 모두 읽음 처리하지 못했습니다.', error)
    })
  }

  const handleNotifClick = (notif: Notif) => {
    if (!notif.isRead) {
      void markAsRead(notif.notifId).catch((error: unknown) => {
        console.error('알림을 읽음 처리하지 못했습니다.', error)
      })
    }

    switch (notif.notifType) {
      case 'NOTICE':
        router.push('/notices')
        break
      case 'REPORT_SUCCESS':
        router.push(`/report/${notif.targetId}`)
        break
      case 'REPORT_PROCESSING':
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
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          className="text-muted-foreground hover:bg-muted hover:text-foreground relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl transition-colors outline-none"
          aria-label="알림"
        >
          <Bell className="h-4.5 w-4.5" />
          {unreadCount > 0 && (
            <span className="bg-primary text-primary-foreground absolute top-0.5 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] leading-none font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[calc(100vw-2rem)] max-w-88 p-0">
        <div className="border-border/50 flex items-center justify-between border-b px-4 py-3">
          <span className="text-sm font-semibold">알림</span>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              className="text-muted-foreground hover:text-foreground text-xs transition"
            >
              모두 읽음
            </button>
          )}
        </div>
        <NotifList
          notifs={notifs}
          hasMore={hasMore}
          isLoading={isLoading}
          isLoadingMore={isLoadingMore}
          onNotifClick={handleNotifClick}
          onLoadMore={handleLoadMore}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
