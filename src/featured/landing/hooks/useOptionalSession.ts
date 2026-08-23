'use client'

import { useEffect, useState } from 'react'
import {
  verifyOptionalCurrentUser,
  type OptionalSessionResult,
} from '@/featured/auth/actions/auth.action'
import { useAuthStoreHydrated } from '@/featured/auth/hooks/useAuthStoreHydrated'
import { useAuthStore } from '@/featured/auth/store'
import { clearNotifClientSession } from '@/featured/notif/hooks/notifClientSession'

export type OptionalSessionStatus = 'checking' | OptionalSessionResult['status']

export function useOptionalSession(): OptionalSessionStatus {
  const hasHydrated = useAuthStoreHydrated()
  const restoreSession = useAuthStore((state) => state.restoreSession)
  const logout = useAuthStore((state) => state.logout)
  const [status, setStatus] = useState<OptionalSessionStatus>('checking')

  useEffect(() => {
    if (!hasHydrated) return

    let cancelled = false

    verifyOptionalCurrentUser()
      .then((result) => {
        if (cancelled) return

        if (result.status === 'authenticated') {
          const currentUserId = useAuthStore.getState().user?.id
          if (currentUserId !== undefined && currentUserId !== result.user.id) {
            clearNotifClientSession()
          }
          restoreSession(result.user)
        } else if (result.status === 'guest') {
          clearNotifClientSession()
          logout()
        }

        setStatus(result.status)
      })
      .catch((error: unknown) => {
        if (cancelled) return

        console.error('공개 페이지 세션 확인 요청에 실패했습니다.', error)
        setStatus('unavailable')
      })

    return () => {
      cancelled = true
    }
  }, [hasHydrated, logout, restoreSession])

  return status
}
