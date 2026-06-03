'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { EndDialogModal } from '@/featured/interview/components/EndDialogModal'
import { InterviewSetupModal } from '@/featured/interview/components/InterviewSetupModal'
import { InterviewContainer } from '@/featured/interview/components/InterviewContainer'
import { useInterview } from '@/featured/interview/hooks/useInterview'

export function InterviewLayout() {
  const session = useInterview()
  const searchParams = useSearchParams()
  const isRestart = searchParams.get('restart') === 'true'

  useEffect(() => {
    const { interviewId, phase } = session
    if (interviewId === null || phase === 'ready' || phase === 'finished') return

    const sendPause = () => {
      navigator.sendBeacon(
        '/api/interview/pause',
        new Blob([JSON.stringify({ intvId: interviewId })], { type: 'application/json' }),
      )
    }

    window.addEventListener('beforeunload', sendPause)
    window.addEventListener('popstate', sendPause)

    return () => {
      window.removeEventListener('beforeunload', sendPause)
      window.removeEventListener('popstate', sendPause)
    }
  }, [session.interviewId, session.phase])

  return (
    <>
      <InterviewContainer session={session} />
      <EndDialogModal session={session} />
      <InterviewSetupModal session={session} isRestart={isRestart} />
    </>
  )
}
