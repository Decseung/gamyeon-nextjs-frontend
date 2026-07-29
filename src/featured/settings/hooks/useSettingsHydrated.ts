'use client'

import { useSyncExternalStore } from 'react'
import { useSettingsStore } from '../store'

function subscribeToHydration(onStoreChange: () => void) {
  const persist = useSettingsStore.persist

  if (!persist) return () => undefined

  const unsubscribeHydrate = persist.onHydrate(onStoreChange)
  const unsubscribeFinishHydration = persist.onFinishHydration(onStoreChange)

  return () => {
    unsubscribeHydrate()
    unsubscribeFinishHydration()
  }
}

function getHydrationSnapshot() {
  return useSettingsStore.persist?.hasHydrated() ?? false
}

export function useSettingsHydrated() {
  return useSyncExternalStore(subscribeToHydration, getHydrationSnapshot, () => false)
}
