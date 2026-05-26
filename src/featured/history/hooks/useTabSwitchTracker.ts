import { useEffect, useRef } from 'react'
import { trackFunnel } from '@/shared/lib/utils/analytics'

export const useTabSwitchTracker = (isTrackingActive: boolean) => {
  // 이미 이벤트를 쐈는지 기억하는 메모지 (리렌더링되어도 값이 유지됨)
  const hasTracked = useRef(false)

  useEffect(() => {
    if (!isTrackingActive) return

    // 추적이 새로 켜질 때마다 메모지를 초기화
    hasTracked.current = false

    const handleVisibilityChange = () => {
      // 탭이 숨겨졌고 && 아직 이벤트를 안 쐈을 때만 실행
      if (document.hidden && !hasTracked.current) {
        trackFunnel('loading_tab_leave')
        hasTracked.current = true // "이제 쐈다!" 라고 표시
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isTrackingActive])
}
