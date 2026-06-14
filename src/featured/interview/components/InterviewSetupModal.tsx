'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, ChevronRight } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { CameraStep } from '@/featured/interview/components/setup/CameraStep'
import { DocumentStep } from '@/featured/interview/components/setup/DocumentStep'
import { MicStep } from '@/featured/interview/components/setup/MicStep'
import { SetupSidebar } from '@/featured/interview/components/setup/SetupSidebar'
import { TitleStep } from '@/featured/interview/components/setup/TitleStep'
import { useCameraHandler } from '@/featured/interview/hooks/useCameraHandler'
import type { useInterview } from '@/featured/interview/hooks/useInterview'
import { useMicPermission } from '@/featured/interview/hooks/useMicPermission'
import { useMicRecorder } from '@/featured/interview/hooks/useMicRecorder'
import { type InterviewFileType, type StepStatus } from '@/featured/interview/types'
import { Button } from '@/shared/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/shared/ui/dialog'
import {
  completeFileUploadAction,
  createInterviewAction,
  generateInterviewQuestionAction,
  issuePresignedUrlAction,
  restartInterviewAction,
  startInterviewAction,
  updateInterviewTitleAction,
} from '@/featured/interview/actions/interview.action'
import uploadFileToS3 from '@/shared/lib/utils/uploadFileToS3'
import { useQuestionPolling } from '@/featured/interview/hooks/useQuestionPolling'
import { toast } from 'sonner'
import { trackEvent } from '@/shared/lib/utils/analytics'

interface InterviewSetupModalProps {
  session: ReturnType<typeof useInterview>
  isRestart?: boolean
}

const RESUME_LOCKED_STEPS = [1, 2]
const STEP2_LOCKED = [2]

export function InterviewSetupModal({ session, isRestart = false }: InterviewSetupModalProps) {
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(() =>
    isRestart ? new Set([1, 2]) : new Set(),
  )
  const [isStep2Locked, setIsStep2Locked] = useState(isRestart)
  const [currentStep, setCurrentStep] = useState(() => (isRestart ? 3 : 1))
  const [maxReachedStep, setMaxReachedStep] = useState(() => (isRestart ? 3 : 1))
  const [title, setTitle] = useState('')
  const [resume, setResume] = useState<File | null>(null)
  const [portfolio, setPortfolio] = useState<File | null>(null)
  const [coverLetter, setCoverLetter] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isPollingActive, setIsPollingActive] = useState(false)

  const cameraHandler = useCameraHandler()
  const micPermission = useMicPermission(() => {
    if (!isRestart) setIsPollingActive(true)
  })
  const micRecorder = useMicRecorder(micPermission.micStreamRef)

  const handlePollingComplete = useCallback(() => {
    setIsPollingActive(false)
  }, [])
  const { data: questions } = useQuestionPolling(
    session.interviewId,
    isPollingActive,
    handlePollingComplete,
  )
  const activeQuestions =
    isRestart && session.unansweredQuestions?.length
      ? session.unansweredQuestions
      : questions

  const isQuestionsReady = !!activeQuestions && activeQuestions.length > 0

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

  const statuses: StepStatus[] = [1, 2, 3, 4].map((step) => {
    if (step === currentStep) return 'active'
    if (completedSteps.has(step)) return 'done'
    return 'pending'
  })

  const doneCount = completedSteps.size
  const allDone = doneCount === 4

  const handleDocumentConfirm = async () => {
    if (!session.interviewId || !resume) return

    try {
      setIsUploading(true)
      const uploadTargets: Array<{ file: File | null; type: InterviewFileType }> = [
        { file: resume, type: 'RESUME' },
        { file: portfolio, type: 'PORTFOLIO' },
        { file: coverLetter, type: 'COVER_LETTER' },
      ]
      const uploadedFiles: Array<{
        fileType: InterviewFileType
        originalFileName: string
        fileKey: string
        fileUrl: string
      }> = []

      for (const target of uploadTargets) {
        if (!target.file) continue

        const urlRes = await issuePresignedUrlAction(session.interviewId, {
          fileType: target.type,
          originalFileName: target.file.name,
          fileSizeBytes: target.file.size,
          contentType: 'application/pdf',
        })

        if (!urlRes.success || !urlRes.data) {
          throw new Error(urlRes.message || `${target.type} presigned URL 발급 실패`)
        }

        const { presignedUrl, fileType, originalFileName, fileKey, fileUrl } = urlRes.data
        const s3Res = await uploadFileToS3(target.file, presignedUrl)

        if (!s3Res.success) {
          throw new Error(`${target.type} S3 업로드 실패`)
        }

        trackEvent('upload_s3_success', { category: 'interview_setup' })
        uploadedFiles.push({
          fileType,
          originalFileName,
          fileKey,
          fileUrl,
        })
      }

      if (uploadedFiles.length === 0) {
        toast.error('업로드할 파일이 없습니다.')
      }

      const completeRes = await completeFileUploadAction(session.interviewId, {
        files: uploadedFiles,
      })
      if (!completeRes.success) {
        toast.error(completeRes.message || '파일 업로드 완료 처리 실패')
        return
      }

      completeStep(2)
      setIsStep2Locked(true)

      // 질문 생성을 기다리는 시간의 시작점 코드 추가 - GA 이벤트 전송
      trackEvent('question_gen_start', { category: 'user_interview' })
      generateInterviewQuestionAction(session.interviewId).catch((err) => console.error(err))
    } catch (error) {
      console.error('문서 업로드 중 오류:', error)
      const errorMessage = error instanceof Error ? error.message : '문서 업로드 중 오류 발생'

      trackEvent('upload_s3_error', { category: 'interview_setup' })
      toast.error(errorMessage)
    } finally {
      setIsUploading(false)
    }
  }

  const completeStep = (step: number) => {
    const newCompleted = new Set([...completedSteps, step])
    setCompletedSteps(newCompleted)
    const nextStep = [1, 2, 3, 4].find((s) => !newCompleted.has(s))
    const dest = nextStep ?? 5
    setCurrentStep(dest)
    if (dest > maxReachedStep) setMaxReachedStep(dest)
  }

  const syncInterviewTitle = async () => {
    if (!session.interviewId) return

    const titleRegex = /^[가-힣a-zA-Z0-9 ]{1,20}$/
    const nextTitle = title.trim()

    if (!nextTitle || !titleRegex.test(nextTitle)) return

    const result = await updateInterviewTitleAction(session.interviewId, nextTitle)
    if (!result.success) {
      toast.error(result.message || '면접 제목 수정 실패')
    } else {
      setTitle(nextTitle)
    }
  }

  const navigateToStep = (step: number) => {
    if (step === 2 && isStep2Locked) return
    if (step === 1 && isRestart) return
    if (maxReachedStep >= 4 || completedSteps.has(step)) {
      if (step === 1) {
        void syncInterviewTitle()
      }
      setCurrentStep(step)
    }
  }

  const handleTitleConfirm = async () => {
    const titleRegex = /^[가-힣a-zA-Z0-9 ]{1,20}$/
    const targetTitle = title.trim()

    if (!targetTitle) {
      toast.error('면접 제목을 입력해주세요.')
      return
    }
    if (!titleRegex.test(targetTitle)) {
      toast.error('제목은 공백을 포함한 한글, 영어, 숫자 1~20자만 가능합니다.')
      return
    }

    if (session.interviewId) {
      const result = await updateInterviewTitleAction(session.interviewId, targetTitle)
      if (result.success) {
        setTitle(targetTitle)
        trackEvent('complete_title_input', { category: 'interview_setup' })
        completeStep(1)
      } else {
        toast.error(result.message || '면접 제목 수정 실패')
      }
    } else {
      const result = await createInterviewAction(targetTitle)
      if (result.success) {
        if (result.data) {
          session.setInterviewId(result.data.intvId)
        }
        setTitle(targetTitle)
        trackEvent('complete_title_input', { category: 'interview_setup' })
        completeStep(1)
      } else {
        toast.error(result.message || '면접 생성 실패')
      }
    }
  }

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
          <SetupSidebar
            statuses={statuses}
            doneCount={doneCount}
            onStepClick={navigateToStep}
            freeNavigation={maxReachedStep >= 4}
            lockedSteps={isRestart ? RESUME_LOCKED_STEPS : isStep2Locked ? STEP2_LOCKED : undefined}
          />
          <div className="flex flex-1 flex-col">
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
              <Button variant="ghost" size="sm" onClick={handleCancel} className="cursor-pointer">
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
                {!isQuestionsReady && isPollingActive ? '질문 생성 중' : '면접 시작하기'}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
