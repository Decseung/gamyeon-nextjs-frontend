'use client'

import clarity from '@microsoft/clarity'
import { useEffect } from 'react'

interface ClarityProviderProps {
  clarityId: string
}
export default function ClarityProvider({ clarityId }: ClarityProviderProps) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') return
    if (!clarityId) return

    clarity.init(clarityId)
  }, [clarityId])

  return null
}
