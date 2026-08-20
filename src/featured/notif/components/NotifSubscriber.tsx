'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/featured/auth/store'
import { subscribeNotifs } from '../services/notif.sse.service'
import { useNotifStore } from '../store'

export function NotifSubscriber() {
  const logout = useAuthStore((state) => state.logout)
  const fetchInitialNotifs = useNotifStore((state) => state.fetchInitialNotifs)
  const prependNotif = useNotifStore((state) => state.prependNotif)
  const resetNotifs = useNotifStore((state) => state.resetNotifs)

  useEffect(() => {
    let isActive = true
    let hasConnectedOnce = false

    const syncNotifs = () => {
      void fetchInitialNotifs().catch((error: unknown) => {
        if (isActive) {
          console.error('알림 목록을 불러오지 못했습니다.', error)
        }
      })
    }

    // SSE 연결 여부와 무관하게 기존 알림 목록은 즉시 조회한다.
    syncNotifs()

    const cleanupSubscription = subscribeNotifs({
      onConnected: () => {
        // 최초 연결은 mount 시 시작한 조회가 담당하고, 재연결부터 최신 목록을 동기화한다.
        if (!hasConnectedOnce) {
          hasConnectedOnce = true
          return
        }

        syncNotifs()
      },
      onNotif: (notif) => {
        if (isActive) {
          prependNotif(notif)
        }
      },
      onUnauthorized: () => {
        if (!isActive) return

        isActive = false
        resetNotifs()
        logout()
        window.location.replace('/api/auth/logout?redirectTo=/signin')
      },
    })

    return () => {
      isActive = false
      cleanupSubscription()
    }
  }, [fetchInitialNotifs, logout, prependNotif, resetNotifs])

  return null
}
