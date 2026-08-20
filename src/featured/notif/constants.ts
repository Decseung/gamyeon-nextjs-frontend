import { CheckCircle2, CircleAlert, Loader2, Megaphone, type LucideIcon } from 'lucide-react'
import type { NotifType } from './types'

export const NOTIF_STYLE_CONFIG = {
  NOTICE: { icon: Megaphone, color: 'text-blue-500' },
  REPORT_PROCESSING: { icon: Loader2, color: 'text-primary' },
  REPORT_SUCCESS: { icon: CheckCircle2, color: 'text-green-500' },
  REPORT_FAILED: { icon: CircleAlert, color: 'text-red-500' },
} satisfies Record<NotifType, { icon: LucideIcon; color: string }>

export const NOTIF_LIST_SCROLL = 5
