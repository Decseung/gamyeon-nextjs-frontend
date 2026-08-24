'use client'

import { useAuthStore } from '@/featured/auth/store'
import { NotifSubscriber } from '@/featured/notif/components/NotifSubscriber'
import { Header } from '@/shared/components/header'
import { useOptionalSession } from '../hooks/useOptionalSession'

export function LandingHeaderRuntime() {
  const sessionStatus = useOptionalSession()
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn)
  const isSessionVerified = useAuthStore((state) => state.isSessionVerified)
  const hasAuthenticatedSession =
    sessionStatus === 'authenticated' && isLoggedIn && isSessionVerified

  return (
    <>
      <Header isAuthenticated={hasAuthenticatedSession} />
      {hasAuthenticatedSession && <NotifSubscriber unauthorizedBehavior="stay-on-page" />}
    </>
  )
}
