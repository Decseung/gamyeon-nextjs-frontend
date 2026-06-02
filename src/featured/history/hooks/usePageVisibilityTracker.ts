import { useEffect } from 'react'
import { trackEvent } from '@/shared/lib/utils/analytics'

export const usePageVisibilityTracker = (isTrackingActive: boolean, reportIds: number[]) => {
  const reportIdsKey = reportIds.join('|')

  useEffect(() => {
    if (!isTrackingActive) return

    const handleVisibilityChange = () => {
      if (!document.hidden) return

      reportIds.forEach((reportId) => {
        const hiddenKey = `report_waiting_hidden:${reportId}`

        if (sessionStorage.getItem(hiddenKey)) return

        sessionStorage.setItem(hiddenKey, 'true')
        trackEvent('report_waiting_hidden', {
          category: 'ai_report',
          report_id: reportId,
          page: 'history',
          status: 'generating',
        })
      })
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isTrackingActive, reportIds, reportIdsKey])
}
