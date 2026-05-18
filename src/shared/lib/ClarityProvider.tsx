'use client'

import clarity from '@microsoft/clarity'
import { useEffect } from 'react'

interface ClarityProviderProps {
  clarityId: string
}
export default function ClarityProvider({ clarityId }: ClarityProviderProps) {
  useEffect(() => {
    if (!clarityId) return
    clarity.init(clarityId)
  }, [clarityId])

  return null
}
