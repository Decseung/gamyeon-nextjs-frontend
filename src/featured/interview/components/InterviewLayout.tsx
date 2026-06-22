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
    const from = sessionStorage.getItem('interviewFrom')
    session.setCancelDestination(from === 'history' ? '/history' : '/dashboard')
  }, [])

  useEffect(() => {
    if (isRestart && idParam) {
      const intvId = Number(idParam)
      if (!isNaN(intvId)) {
        session.setInterviewId(intvId)
        const fetchData = async () => {
          const res = await restartContextInterviewAction(intvId)
          if (res.success && res.data) {
            session.setRestartContext(res.data)
          } else if (!res.success) {
            session.setRestartError(res.message)
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
      const body = JSON.stringify({ intvId: interviewId })
      const blob = new Blob([body], { type: 'application/json' })
      const sent = navigator.sendBeacon('/api/interview/pause', blob)
      if (!sent) {
        fetch('/api/interview/pause', {
          method: 'POST',
          body,
          headers: { 'Content-Type': 'application/json' },
          keepalive: true,
        }).catch(() => {})
      }
    }

    const handlePopState = () => {
      if (!window.location.pathname.startsWith('/interview')) {
        sendPause()
      }
    }

    window.addEventListener('beforeunload', sendPause)
    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('beforeunload', sendPause)
      window.removeEventListener('popstate', handlePopState)
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
