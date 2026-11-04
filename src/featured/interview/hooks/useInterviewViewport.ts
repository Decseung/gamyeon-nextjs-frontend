'use client'

import { useSyncExternalStore } from 'react'

const INTERVIEW_VIEWPORT_QUERY = '(min-width: 1024px)'

function subscribeToViewportChange(onStoreChange: () => void) {
  const mediaQuery = window.matchMedia(INTERVIEW_VIEWPORT_QUERY)
  mediaQuery.addEventListener('change', onStoreChange)

  return () => mediaQuery.removeEventListener('change', onStoreChange)
}

export function isInterviewViewportSupported() {
  return window.matchMedia(INTERVIEW_VIEWPORT_QUERY).matches
}

function getServerViewportSnapshot() {
  return null
}

export function useInterviewViewport() {
  return useSyncExternalStore(
    subscribeToViewportChange,
    isInterviewViewportSupported,
    getServerViewportSnapshot,
  )
}
