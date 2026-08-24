'use client'

import { useSyncExternalStore } from 'react'
import { useAuthStore } from '../store'

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

export function useAuthStoreHydrated() {
  return useSyncExternalStore(
    subscribeToHydration,
    getHydrationSnapshot,
    getServerHydrationSnapshot,
  )
}
