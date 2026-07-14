'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, CheckCircle2, ChevronRight, Loader2 } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useSetupSteps } from '@/featured/interview/hooks/useSetupSteps'
import { useDocumentUpload } from '@/featured/interview/hooks/useDocumentUpload'
import { useTitleStep } from '@/featured/interview/hooks/useTitleStep'
import { CameraStep } from '@/featured/interview/components/setup/CameraStep'
import { DocumentStep } from '@/featured/interview/components/setup/DocumentStep'
import { MicStep } from '@/featured/interview/components/setup/MicStep'
import { SetupSidebar } from '@/featured/interview/components/setup/SetupSidebar'
import { TitleStep } from '@/featured/interview/components/setup/TitleStep'
import { useCameraHandler } from '@/featured/interview/hooks/useCameraHandler'
import type { useInterview } from '@/featured/interview/hooks/useInterview'
import { useMicPermission } from '@/featured/interview/hooks/useMicPermission'
import { useMicRecorder } from '@/featured/interview/hooks/useMicRecorder'
import { Button } from '@/shared/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/shared/ui/dialog'
import {
  restartInterviewAction,
  startInterviewAction,
} from '@/featured/interview/actions/interview.action'
import { useQuestionPolling } from '@/featured/interview/hooks/useQuestionPolling'
import { QUESTION_LOADING_TEXTS } from '@/featured/interview/constants'
import { toast } from 'sonner'
import { trackEvent } from '@/shared/lib/utils/analytics'

interface InterviewSetupModalProps {
  session: ReturnType<typeof useInterview>
  isRestart?: boolean
}

const RESUME_LOCKED_STEPS = [1, 2]
const STEP2_LOCKED = [2]

export function InterviewSetupModal({ session, isRestart = false }: InterviewSetupModalProps) {
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

    const handleHistoryBack = () => {
      cleanupSetupDevices()
    }

    window.addEventListener('popstate', handleHistoryBack)
    return () => {
      window.removeEventListener('popstate', handleHistoryBack)
    }
  }, [cleanupSetupDevices, session.showSetup])

  const {
    resume,
    setResume,
    portfolio,
    setPortfolio,
    coverLetter,
    setCoverLetter,
    isUploading,
    handleDocumentConfirm,
  } = useDocumentUpload({ interviewId: session.interviewId, completeStep, setIsStep2Locked })

  const { title, setTitle, syncInterviewTitle, handleTitleConfirm } = useTitleStep({
    interviewId: session.interviewId,
    setInterviewId: session.setInterviewId,
    completeStep,
  })

  const handleCameraConfirm = () => {
    cameraHandler.confirmCamera()
    completeStep(3)
  }

  const handleMicConfirm = () => {
    completeStep(4)
  }

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

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <TitleStep title={title} onChange={setTitle} onConfirm={handleTitleConfirm} />
      case 2:
        return (
          <DocumentStep
            resume={resume}
            portfolio={portfolio}
            coverLetter={coverLetter}
            setResume={setResume}
            setPortfolio={setPortfolio}
            setCoverLetter={setCoverLetter}
            onComplete={handleDocumentConfirm}
            isUploading={isUploading}
          />
        )
      case 3:
        return (
          <CameraStep
            cameraStatus={cameraHandler.cameraStatus}
            cameraVideoRef={cameraHandler.cameraVideoRef}
            isLandmarkerReady={!!cameraHandler.landmarker}
            basePose={cameraHandler.basePose}
            alignProgress={cameraHandler.alignProgress}
            faceDetected={cameraHandler.faceDetected}
            onRequest={cameraHandler.requestCamera}
            onConfirm={handleCameraConfirm}
          />
        )
      case 4:
        return (
          <MicStep
            micStatus={micPermission.micStatus}
            audioLevel={micPermission.audioLevel}
            onRequest={micPermission.requestMic}
            onConfirm={handleMicConfirm}
            onRetry={() => micPermission.setMicStatus('idle')}
            recordingStatus={micRecorder.recordingStatus}
            isPlaying={micRecorder.isPlaying}
            recordedDuration={micRecorder.recordedDuration}
            playbackProgress={micRecorder.playbackProgress}
            onStartRecording={micRecorder.startRecording}
            onStopRecording={micRecorder.stopRecording}
            onPlayRecording={micRecorder.playRecording}
          />
        )
      default:
        if (isFailed) {
          return (
            <div className="flex flex-1 flex-col items-center justify-center">
              <div className="bg-destructive/10 mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                <AlertCircle className="text-destructive h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold">서버 연결에 문제가 발생했습니다</h3>
              <p className="text-muted-foreground mt-1.5 text-sm">
                {isRetryableFailure
                  ? '일시적인 오류입니다. 잠시 후 다시 시도해주세요.'
                  : '대시보드로 이동한 뒤 다시 시도해주세요.'}
              </p>
              <div className="mt-6 flex gap-2">
                {isRetryableFailure && (
                  <Button variant="outline" onClick={restartPolling} className="cursor-pointer">
                    다시 시도
                  </Button>
                )}
                <Button onClick={handleCancel} className="cursor-pointer">
                  대시보드로 이동
                </Button>
              </div>
            </div>
          )
        }
        if (status === 'polling' && !isQuestionsReady) {
          return (
            <div className="flex flex-1 flex-col items-center justify-center">
              <div className="bg-primary/10 mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                <Loader2 className="text-primary h-8 w-8 animate-spin" />
              </div>
              <h3 className="text-lg font-bold">질문 생성중입니다...</h3>
              <div className="mt-1.5 h-5">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={loadingTextIndex}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.3 }}
                    className="text-muted-foreground text-sm"
                  >
                    {QUESTION_LOADING_TEXTS[loadingTextIndex]}
                  </motion.p>
                </AnimatePresence>
              </div>
            </div>
          )
        }
        return (
          <div className="flex flex-1 flex-col items-center justify-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            <h3 className="text-lg font-bold">모든 설정이 완료되었습니다.</h3>
            <p className="text-muted-foreground mt-1.5 text-sm">
              면접을 시작할 준비가 완료되었습니다.
            </p>
          </div>
        )
    }
  }

  return (
    <Dialog
      open={session.showSetup}
      onOpenChange={(isOpen) => {
        if (!isOpen) handleCancel()
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="max-w-7xl min-w-4xl overflow-hidden p-0"
        onInteractOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => event.preventDefault()}
      >
        <DialogTitle className="sr-only">면접 환경 설정</DialogTitle>
        <div className="flex min-h-155">
          {!session.restartError && (
            <SetupSidebar
              statuses={statuses}
              doneCount={doneCount}
              onStepClick={(step) => navigateToStep(step, () => void syncInterviewTitle())}
              freeNavigation={maxReachedStep >= 4}
              lockedSteps={
                isRestart ? RESUME_LOCKED_STEPS : isStep2Locked ? STEP2_LOCKED : undefined
              }
            />
          )}
          <div className="flex flex-1 flex-col">
            {session.restartError ? (
              <>
                <div className="flex flex-1 flex-col items-center justify-center px-8 py-8">
                  <p className="text-muted-foreground text-center text-sm">
                    {session.restartError}
                  </p>
                </div>
                <div className="border-border/50 flex items-center justify-end border-t px-8 py-4">
                  <Button onClick={session.handleSetupCancel} className="cursor-pointer">
                    확인
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-1 flex-col overflow-y-auto px-8 py-8">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentStep}
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -16 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                      className="flex flex-1 flex-col"
                    >
                      {renderStep()}
                    </motion.div>
                  </AnimatePresence>
                </div>
                <div className="border-border/50 flex items-center justify-between border-t px-8 py-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancel}
                    className="cursor-pointer"
                  >
                    취소
                  </Button>
                  <Button
                    disabled={
                      !allDone ||
                      !isQuestionsReady ||
                      !cameraHandler.cameraStream ||
                      (!isRestart && (!title.trim() || !resume))
                    }
                    onClick={async () => {
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
                        title: title.trim() || '모의 면접',
                        basePose: cameraHandler.basePose,
                        stream: cameraHandler.cameraStream,
                        interviewId: session.interviewId,
                        questions: activeQuestions ?? [],
                      })
                    }}
                    className="cursor-pointer gap-2"
                  >
                    면접 시작하기
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
