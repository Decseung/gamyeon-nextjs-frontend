import { NOTIF_LIST_SCROLL } from '../constants'
import type { Notif } from '../types'
import { NotifItem } from './NotifItem'

interface NotifListProps {
  notifs: Notif[]
  onNotifClick: (notif: Notif) => void
}

export function NotifList({ notifs, onNotifClick }: NotifListProps) {
  if (notifs.length === 0) {
    return <div className="text-muted-foreground py-8 text-center text-sm">알림이 없어요.</div>
  }

  const isScrollable = notifs.length > NOTIF_LIST_SCROLL

  return (
    <ul className={isScrollable ? 'max-h-100 overflow-y-auto overscroll-contain' : undefined}>
      {notifs.map((notif) => (
        <NotifItem key={notif.notifId} notif={notif} onClick={onNotifClick} />
      ))}
    </ul>
  )
}
