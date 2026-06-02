import { useEffect, useRef } from 'react'
import { trackFunnel } from '@/shared/lib/utils/analytics'

export const usePageVisibilityTracker = (isTrackingActive: boolean) => {
  const hasTracked = useRef(false)

  useEffect(() => {
    if (!isTrackingActive) {
      hasTracked.current = false
      return
    }

    const handleVisibilityChange = () => {
      if (document.hidden && !hasTracked.current) {
        trackFunnel('report_waiting_hidden')
        hasTracked.current = true
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isTrackingActive])
}
