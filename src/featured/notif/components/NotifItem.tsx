import { MoveRight } from 'lucide-react'
import { NOTIF_STYLE_CONFIG } from '../constants'
import type { Notif } from '../types'
import { cn } from '@/shared/lib/utils'
import { formatMonthDayTimeKorean } from '@/shared/lib/utils/date'

interface NotifItemProps {
  notif: Notif
  onClick: (notif: Notif) => void
}

export function NotifItem({ notif, onClick }: NotifItemProps) {
  const { icon: Icon, color } = NOTIF_STYLE_CONFIG[notif.notifType]
  const isNavigable = notif.notifType !== 'REPORT_PROCESSING'

  return (
    <li className="border-border/40 h-24 border-b last:border-b-0">
      <button
        type="button"
        onClick={() => onClick(notif)}
        className={cn(
          'focus-visible:ring-primary/40 flex h-full w-full cursor-pointer gap-3 overflow-hidden px-4 py-3 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset',
          notif.isRead ? 'hover:bg-muted/60' : 'bg-primary/10 hover:bg-primary/15',
        )}
      >
        <div className={cn('mt-0.5 shrink-0', color)}>
          <Icon
            aria-hidden="true"
            className={cn('h-4 w-4', notif.notifType === 'REPORT_PROCESSING' && 'animate-spin')}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <p className="truncate text-sm font-medium" title={notif.title}>
              {notif.title}
            </p>
            {!notif.isRead && <span className="bg-primary h-1.5 w-1.5 shrink-0 rounded-full" />}
          </div>
          <p
            className="text-muted-foreground mt-0.5 truncate text-xs leading-relaxed"
            title={notif.content}
          >
            {notif.content}
          </p>
          <time
            dateTime={notif.createdAt}
            className="text-muted-foreground/70 mt-1 block text-[11px]"
          >
            {formatMonthDayTimeKorean(notif.createdAt)}
          </time>
        </div>
        {isNavigable && (
          <MoveRight
            aria-hidden="true"
            className="text-muted-foreground/60 h-4 w-4 shrink-0 self-center"
          />
        )}
      </button>
    </li>
  )
}
