import type { Notif } from '../types'
import { NotifItem } from './NotifItem'

interface NotifListProps {
  notifs: Notif[]
  hasMore: boolean
  isLoading: boolean
  isLoadingMore: boolean
  isMarkingAllAsRead: boolean
  onNotifClick: (notif: Notif) => void
  onLoadMore: () => void
}

export function NotifList({
  notifs,
  hasMore,
  isLoading,
  isLoadingMore,
  isMarkingAllAsRead,
  onNotifClick,
  onLoadMore,
}: NotifListProps) {
  const showLoadMore = hasMore && (!isLoading || notifs.length > 0)

  return (
    <div className="max-h-[30rem] min-h-0 flex-1 overflow-y-auto overscroll-contain">
      {notifs.length === 0 ? (
        <div className="text-muted-foreground py-8 text-center text-sm" aria-live="polite">
          {isLoading ? '알림을 불러오는 중이에요.' : '알림이 없어요.'}
        </div>
      ) : (
        <ul>
          {notifs.map((notif) => (
            <NotifItem key={notif.notifId} notif={notif} onClick={onNotifClick} />
          ))}
        </ul>
      )}
      {showLoadMore && (
        <div className="border-border/50 border-t p-2">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={isLoadingMore || isMarkingAllAsRead}
            className="text-muted-foreground hover:bg-muted hover:text-foreground w-full rounded-md px-3 py-2 text-xs transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoadingMore ? '불러오는 중...' : '더 보기'}
          </button>
        </div>
      )}
    </div>
  )
}
