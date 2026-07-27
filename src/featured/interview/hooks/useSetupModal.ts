'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useSetupSteps } from './useSetupSteps'
import { useDocumentUpload } from './useDocumentUpload'
import { useTitleStep } from './useTitleStep'
import { useCameraHandler } from './useCameraHandler'
import { useMicPermission } from './useMicPermission'
import { useMicRecorder } from './useMicRecorder'
import { useQuestionPolling } from './useQuestionPolling'
import {
  restartInterviewAction,
  startInterviewAction,
} from '@/featured/interview/actions/interview.action'
import { QUESTION_LOADING_TEXTS } from '@/featured/interview/constants'
import { toast } from 'sonner'
import { trackEvent } from '@/shared/lib/utils/analytics'
import type { useInterview } from './useInterview'

interface UseSetupModalParams {
  session: ReturnType<typeof useInterview>
  isRestart: boolean
}

export function useSetupModal({ session, isRestart }: UseSetupModalParams) {
  const {
    isStep2Locked,
    setIsStep2Locked,
    currentStep,
    maxReachedStep,
    completeStep,
    navigateToStep,
    doneCount,
    allDone,
    statuses,
  } = useSetupSteps(isRestart)

  const [isPollingActive, setIsPollingActive] = useState(false)
  const [loadingTextIndex, setLoadingTextIndex] = useState(0)

  const cameraHandler = useCameraHandler()
  const micPermission = useMicPermission(() => {
    if (!isRestart) setIsPollingActive(true)
  })
  const micRecorder = useMicRecorder(micPermission.micStreamRef)

  const handlePollingComplete = useCallback(() => {
    setIsPollingActive(false)
  }, [])
  const { questions, status, isFailed, isRetryableFailure, restartPolling } = useQuestionPolling(
    session.interviewId,
    isPollingActive,
    handlePollingComplete,
  )
  const activeQuestions =
    isRestart && session.unansweredQuestions?.length ? session.unansweredQuestions : questions
  const isQuestionsReady = !!activeQuestions && activeQuestions.length > 0

  useEffect(() => {
    if (!isPollingActive || isQuestionsReady || isFailed) return
    const interval = setInterval(() => {
      setLoadingTextIndex((prev) => (prev + 1) % QUESTION_LOADING_TEXTS.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [isPollingActive, isQuestionsReady, isFailed])

  const { cleanupCamera } = cameraHandler
  const { cleanupMic } = micPermission
  const cleanupSetupDevices = useCallback(() => {
    cleanupMic()
    cleanupCamera()
  }, [cleanupCamera, cleanupMic])

  const handleCancel = useCallback(() => {
    cleanupSetupDevices()
    session.handleSetupCancel()
  }, [cleanupSetupDevices, session])

  useEffect(() => {
    if (!session.showSetup) return
    trackEvent('open_interview_modal', { category: 'interview_setup' })
    const handleHistoryBack = () => cleanupSetupDevices()
    window.addEventListener('popstate', handleHistoryBack)
    return () => window.removeEventListener('popstate', handleHistoryBack)
  }, [cleanupSetupDevices, session.showSetup])

  const documentUpload = useDocumentUpload({
    interviewId: session.interviewId,
    completeStep,
    setIsStep2Locked,
  })
  const titleStep = useTitleStep({
    interviewId: session.interviewId,
    setInterviewId: session.setInterviewId,
    completeStep,
  })

  const handleCameraConfirm = useCallback(() => {
    cameraHandler.confirmCamera()
    completeStep(3)
  }, [cameraHandler, completeStep])

  const handleMicConfirm = useCallback(() => {
    completeStep(4)
  }, [completeStep])

  const handleStart = useCallback(async () => {
    if (!cameraHandler.cameraStream) {
      console.error('카메라 스트림이 아직 준비되지 않았습니다.')
      return
    }
    if (session.interviewId) {
      if (isRestart) {
        await restartInterviewAction(session.interviewId)
      } else {
        await startInterviewAction(session.interviewId)
      }
    }
    trackEvent('start_interview', { category: 'interview_setup' })
    session.handleSetupComplete({
      title: titleStep.title.trim() || '모의 면접',
      basePose: cameraHandler.basePose,
      stream: cameraHandler.cameraStream,
      interviewId: session.interviewId,
      questions: activeQuestions ?? [],
    })
  }, [cameraHandler, session, isRestart, titleStep.title, activeQuestions])

  const isStartDisabled =
    !allDone ||
    !isQuestionsReady ||
    !cameraHandler.cameraStream ||
    (!isRestart && (!titleStep.title.trim() || !documentUpload.resume))

  const hasShownBasePoseToastRef = useRef<boolean>(false)
  useEffect(() => {
    if (cameraHandler.basePose && !hasShownBasePoseToastRef.current) {
      toast.success('확인 완료 버튼을 눌러주세요.')
      hasShownBasePoseToastRef.current = true
    }
    if (!cameraHandler.basePose) {
      hasShownBasePoseToastRef.current = false
    }
  }, [cameraHandler.basePose])

  return {
    // step
    currentStep,
    maxReachedStep,
    navigateToStep,
    statuses,
    doneCount,
    isStep2Locked,
    // polling
    loadingTextIndex,
    isQuestionsReady,
    isFailed,
    isRetryableFailure,
    status,
    restartPolling,
    // devices
    cameraHandler,
    micPermission,
    micRecorder,
    // data
    documentUpload,
    titleStep,
    // handlers
    handleCancel,
    handleCameraConfirm,
    handleMicConfirm,
    handleStart,
    isStartDisabled,
  }
}