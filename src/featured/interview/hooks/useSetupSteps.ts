'use client'

import { useState } from 'react'
import type { StepStatus } from '@/featured/interview/types'

export function useSetupSteps(isRestart: boolean) {
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(() =>
    isRestart ? new Set([1, 2]) : new Set(),
  )
  const [isStep2Locked, setIsStep2Locked] = useState(isRestart)
  const [currentStep, setCurrentStep] = useState(() => (isRestart ? 3 : 1))
  const [maxReachedStep, setMaxReachedStep] = useState(() => (isRestart ? 3 : 1))

  const completeStep = (step: number) => {
    const newCompleted = new Set([...completedSteps, step])
    setCompletedSteps(newCompleted)
    const nextStep = [1, 2, 3, 4].find((s) => !newCompleted.has(s))
    const dest = nextStep ?? 5
    setCurrentStep(dest)
    if (dest > maxReachedStep) setMaxReachedStep(dest)
  }

  const navigateToStep = (step: number, onStep1?: () => void) => {
    if (step === 2 && isStep2Locked) return
    if (step === 1 && isRestart) return
    if (maxReachedStep >= 4 || completedSteps.has(step)) {
      if (step === 1) onStep1?.()
      setCurrentStep(step)
    }
  }

  const statuses: StepStatus[] = [1, 2, 3, 4].map((step) => {
    if (step === currentStep) return 'active'
    if (completedSteps.has(step)) return 'done'
    return 'pending'
  })

  return {
    completedSteps,
    isStep2Locked,
    setIsStep2Locked,
    currentStep,
    maxReachedStep,
    completeStep,
    navigateToStep,
    doneCount: completedSteps.size,
    allDone: completedSteps.size === 4,
    statuses,
  }
}