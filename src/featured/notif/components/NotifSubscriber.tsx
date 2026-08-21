'use client'

import { useEffect, useRef } from 'react'
import { useAuthStore } from '@/featured/auth/store'
import { invalidateNotifSession, useNotifActions } from '../hooks/useNotifActions'
import { disconnectNotifsImmediately, subscribeNotifs } from '../services/notif.sse.service'
import { useNotifStore } from '../store'

export function NotifSubscriber() {
  const userId = useAuthStore((state) => state.user?.id)
  const logout = useAuthStore((state) => state.logout)
  const { fetchInitialNotifs } = useNotifActions()
  const previousSessionKeyRef = useRef<string | null>(null)

  useEffect(() => {
    const sessionKey = userId === undefined ? null : String(userId)

    if (previousSessionKeyRef.current && previousSessionKeyRef.current !== sessionKey) {
      disconnectNotifsImmediately()
      invalidateNotifSession()
      useNotifStore.getState().resetNotifs()
    }

    previousSessionKeyRef.current = sessionKey

    if (!sessionKey) return

    let isActive = true

    const requestSync = () => {
      void fetchInitialNotifs(sessionKey).catch((error: unknown) => {
        if (isActive) {
          console.error('알림 목록을 불러오지 못했습니다.', error)
        }
      })
    }

    // 최초 목록 조회와 SSE 재연결 후 누락 보정을 같은 in-flight 요청으로 합친다.
    requestSync()

    const cleanupSubscription = subscribeNotifs({
      sessionKey,
      onConnected: (isReconnect) => {
        if (isReconnect) requestSync()
      },
      onNotif: (notif) => {
        if (isActive) {
          useNotifStore.getState().prependNotif(notif)
        }
      },
      onUnauthorized: () => {
        if (!isActive) return

        isActive = false
        previousSessionKeyRef.current = null
        disconnectNotifsImmediately()
        invalidateNotifSession()
        useNotifStore.getState().resetNotifs()
        logout()
        window.location.replace('/api/auth/logout?redirectTo=/signin')
      },
    })

    return () => {
      isActive = false
      cleanupSubscription()
    }
  }, [fetchInitialNotifs, logout, userId])

  return null
}
