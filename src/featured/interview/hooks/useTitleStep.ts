'use client'

import { useState } from 'react'
import {
  createInterviewAction,
  updateInterviewTitleAction,
} from '@/featured/interview/actions/interview.action'
import { toast } from 'sonner'
import { trackEvent } from '@/shared/lib/utils/analytics'

interface UseTitleStepParams {
  interviewId: number | null
  setInterviewId: (id: number) => void
  completeStep: (step: number) => void
}

export function useTitleStep({ interviewId, setInterviewId, completeStep }: UseTitleStepParams) {
  const [title, setTitle] = useState('')

  const syncInterviewTitle = async () => {
    const result = await updateInterviewTitleAction(interviewId, title)
    if (!result.success) {
      toast.error(result.message || '면접 제목 수정 실패')
    } else {
      setTitle(title)
    }
  }

  const handleTitleConfirm = async () => {
    if (interviewId) {
      const result = await updateInterviewTitleAction(interviewId, title)
      if (result.success) {
        setTitle(title)
        trackEvent('complete_title_input', { category: 'interview_setup' })
        completeStep(1)
      } else {
        toast.error(result.message || '면접 제목 수정 실패')
      }
    } else {
      const result = await createInterviewAction(title)
      if (result.success) {
        if (result.data) {
          setInterviewId(result.data.intvId)
        }
        setTitle(title)
        trackEvent('complete_title_input', { category: 'interview_setup' })
        completeStep(1)
      } else {
        toast.error(result.message || '면접 생성 실패')
      }
    }
  }

  return {
    title,
    setTitle,
    syncInterviewTitle,
    handleTitleConfirm,
  }
}