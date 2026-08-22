import { NOTIF_LIST_SCROLL } from '../constants'
import type { Notif } from '../types'
import { NotifItem } from './NotifItem'

interface NotifListProps {
  notifs: Notif[]
  hasMore: boolean
  isLoading: boolean
  isLoadingMore: boolean
  onNotifClick: (notif: Notif) => void
  onLoadMore: () => void
}

export function NotifList({
  notifs,
  hasMore,
  isLoading,
  isLoadingMore,
  onNotifClick,
  onLoadMore,
}: NotifListProps) {
  if (notifs.length === 0) {
    return (
      <>
        <div className="text-muted-foreground py-8 text-center text-sm" aria-live="polite">
          {isLoading ? '알림을 불러오는 중이에요.' : '알림이 없어요.'}
        </div>
        {!isLoading && hasMore && (
          <div className="border-border/50 border-t p-2">
            <button
              type="button"
              onClick={onLoadMore}
              disabled={isLoadingMore}
              className="text-muted-foreground hover:bg-muted hover:text-foreground w-full rounded-md px-3 py-2 text-xs transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoadingMore ? '불러오는 중...' : '더 보기'}
            </button>
          </div>
        )}
      </>
    )
  }

  const isScrollable = notifs.length > NOTIF_LIST_SCROLL

  return (
    <div className={isScrollable ? 'max-h-100 overflow-y-auto overscroll-contain' : undefined}>
      <ul>
        {notifs.map((notif) => (
          <NotifItem key={notif.notifId} notif={notif} onClick={onNotifClick} />
        ))}
      </ul>
      {hasMore && (
        <div className="border-border/50 border-t p-2">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="text-muted-foreground hover:bg-muted hover:text-foreground w-full rounded-md px-3 py-2 text-xs transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoadingMore ? '불러오는 중...' : '더 보기'}
          </button>
        </div>
      )}
    </div>
  )
}
