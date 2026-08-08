import type { ElementType } from 'react'
import { CheckCircle2, CircleAlert, Loader2, Megaphone } from 'lucide-react'
import type { Notif, NotifType } from '../types'
import { cn } from '@/shared/lib/utils'

const NOTIF_STYLE_CONFIG = {
  NOTICE: { icon: Megaphone, color: 'text-blue-500' },
  REPORT_PROCESSING: { icon: Loader2, color: 'text-primary' },
  REPORT_SUCCESS: { icon: CheckCircle2, color: 'text-green-500' },
  REPORT_FAILED: { icon: CircleAlert, color: 'text-red-500' },
} satisfies Record<NotifType, { icon: ElementType; color: string }>

interface NotifItemProps {
  notif: Notif
  onClick: (notif: Notif) => void
}

function formatCreatedAt(createdAt: string) {
  return new Date(createdAt).toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function NotifItem({ notif, onClick }: NotifItemProps) {
  const { icon: Icon, color } = NOTIF_STYLE_CONFIG[notif.notifType]

  return (
    <li className="border-border/40 border-b last:border-b-0">
      <button
        type="button"
        onClick={() => onClick(notif)}
        className={cn(
          'hover:bg-muted/60 focus-visible:ring-primary/40 flex w-full cursor-pointer gap-3 px-4 py-3 text-left transition focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset',
          !notif.isRead && 'bg-primary/5',
        )}
      >
        <div className={cn('mt-0.5 shrink-0', color)}>
          <Icon
            aria-hidden="true"
            className={cn('h-4 w-4', notif.notifType === 'REPORT_PROCESSING' && 'animate-spin')}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">{notif.title}</p>
            {!notif.isRead && <span className="bg-primary h-1.5 w-1.5 shrink-0 rounded-full" />}
          </div>
          <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">{notif.content}</p>
          <time
            dateTime={notif.createdAt}
            className="text-muted-foreground/70 mt-1 block text-[11px]"
          >
            {formatCreatedAt(notif.createdAt)}
          </time>
        </div>
      </button>
    </li>
  )
}
