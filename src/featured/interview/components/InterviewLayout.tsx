'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { EndDialogModal } from '@/featured/interview/components/EndDialogModal'
import { InterviewSetupModal } from '@/featured/interview/components/InterviewSetupModal'
import { InterviewContainer } from '@/featured/interview/components/InterviewContainer'
import { useInterview } from '@/featured/interview/hooks/useInterview'
import { restartContextInterviewAction } from '@/featured/interview/actions/interview.action'

export function InterviewLayout() {
  const session = useInterview()
  const searchParams = useSearchParams()
  const isRestart = searchParams.get('restart') === 'true'
  const idParam = searchParams.get('id')

  useEffect(() => {
    if (isRestart && idParam) {
      const intvId = Number(idParam)
      if (!isNaN(intvId)) {
        session.setInterviewId(intvId)
        const fetchData = async () => {
          const res = await restartContextInterviewAction(intvId)
          if (res.success && res.data) {
            session.setRestartContext(res.data)
          }
        }
        fetchData()
      }
    }
  }, [isRestart, idParam])

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
