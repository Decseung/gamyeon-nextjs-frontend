'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/featured/auth/store'
import { subscribeNotifs } from '../services/notif.sse.service'
import { useNotifStore } from '../store'

export function NotifSubscriber() {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn)
  const accessToken = useAuthStore((state) => state.accessToken)
  const clearAuthStore = useAuthStore((state) => state.logout)
  const fetchInitialNotifs = useNotifStore((state) => state.fetchInitialNotifs)
  const prependNotif = useNotifStore((state) => state.prependNotif)
  const resetNotifs = useNotifStore((state) => state.resetNotifs)

  useEffect(() => {
    if (!isLoggedIn || !accessToken) {
      resetNotifs()
      return
    }

    const cleanup = subscribeNotifs({
      accessToken,
      onConnected: () => {
        void fetchInitialNotifs().catch((error: unknown) => {
          console.error('최초 알림 목록을 조회하지 못했습니다.', error)
        })
      },
      onNotif: prependNotif,
      onUnauthorized: () => {
        resetNotifs()
        clearAuthStore()
        window.location.replace('/api/auth/logout?redirectTo=/signin')
      },
    })

    return cleanup
  }, [accessToken, clearAuthStore, fetchInitialNotifs, isLoggedIn, prependNotif, resetNotifs])

  return null
}
