'use client'

import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { verifyCurrentUser } from '@/featured/auth/actions/auth.action'
import { useAuthStore } from '@/featured/auth/store'
import { Button } from '@/shared/ui/button'

interface AuthStoreHydratorProps {
  children: ReactNode
}

function subscribeToHydration(onStoreChange: () => void) {
  const unsubscribeHydration = useAuthStore.persist.onHydrate(onStoreChange)
  const unsubscribeFinishHydration = useAuthStore.persist.onFinishHydration(onStoreChange)

  return () => {
    unsubscribeHydration()
    unsubscribeFinishHydration()
  }
}

function getHydrationSnapshot() {
  return useAuthStore.persist.hasHydrated()
}

function getServerHydrationSnapshot() {
  return false
}

export function AuthStoreHydrator({ children }: AuthStoreHydratorProps) {
  const isSessionVerified = useAuthStore((state) => state.isSessionVerified)
  const restoreSession = useAuthStore((state) => state.restoreSession)
  const hasHydrated = useSyncExternalStore(
    subscribeToHydration,
    getHydrationSnapshot,
    getServerHydrationSnapshot,
  )
  const [hasVerificationError, setHasVerificationError] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    if (!hasHydrated || isSessionVerified) return

    let cancelled = false

    verifyCurrentUser()
      .then((user) => {
        if (cancelled) return
        restoreSession(user)
      })
      .catch((error: unknown) => {
        if (cancelled) return
        console.error('현재 사용자 확인에 실패했습니다.', error)
        setHasVerificationError(true)
      })

    return () => {
      cancelled = true
    }
  }, [hasHydrated, isSessionVerified, restoreSession, retryCount])

  if (hasHydrated && isSessionVerified) return children

  if (hasVerificationError) {
    return (
      <div className="bg-background flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-foreground font-medium">로그인 정보를 확인하지 못했습니다.</p>
        <p className="text-muted-foreground text-sm">잠시 후 다시 시도해주세요.</p>
        <Button
          onClick={() => {
            setHasVerificationError(false)
            setRetryCount((count) => count + 1)
          }}
        >
          다시 시도
        </Button>
      </div>
    )
  }

  return (
    <div className="bg-background flex min-h-screen items-center justify-center">
      <Loader2 className="text-primary h-7 w-7 animate-spin" aria-label="로그인 정보 확인 중" />
    </div>
  )
}
