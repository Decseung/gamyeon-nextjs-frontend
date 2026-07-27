'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { CameraStep } from './CameraStep'
import { DocumentStep } from './DocumentStep'
import { MicStep } from './MicStep'
import { TitleStep } from './TitleStep'
import type { useCameraHandler } from '@/featured/interview/hooks/useCameraHandler'
import type { useMicPermission } from '@/featured/interview/hooks/useMicPermission'
import type { useMicRecorder } from '@/featured/interview/hooks/useMicRecorder'
import type { useDocumentUpload } from '@/featured/interview/hooks/useDocumentUpload'
import type { useTitleStep } from '@/featured/interview/hooks/useTitleStep'
import { QUESTION_LOADING_TEXTS } from '@/featured/interview/constants'

interface SetupStepContentProps {
  currentStep: number
  loadingTextIndex: number
  isQuestionsReady: boolean
  isFailed: boolean
  isRetryableFailure: boolean
  status: string
  cameraHandler: ReturnType<typeof useCameraHandler>
  micPermission: ReturnType<typeof useMicPermission>
  micRecorder: ReturnType<typeof useMicRecorder>
  documentUpload: ReturnType<typeof useDocumentUpload>
  titleStep: ReturnType<typeof useTitleStep>
  onCameraConfirm: () => void
  onMicConfirm: () => void
  onCancel: () => void
  onRestartPolling: () => void
}

export function SetupStepContainer({
  currentStep,
  loadingTextIndex,
  isQuestionsReady,
  isFailed,
  isRetryableFailure,
  status,
  cameraHandler,
  micPermission,
  micRecorder,
  documentUpload,
  titleStep,
  onCameraConfirm,
  onMicConfirm,
  onCancel,
  onRestartPolling,
}: SetupStepContentProps) {
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <TitleStep
            title={titleStep.title}
            onChange={titleStep.setTitle}
            onConfirm={titleStep.handleTitleConfirm}
          />
        )
      case 2:
        return (
          <DocumentStep
            resume={documentUpload.resume}
            portfolio={documentUpload.portfolio}
            coverLetter={documentUpload.coverLetter}
            setResume={documentUpload.setResume}
            setPortfolio={documentUpload.setPortfolio}
            setCoverLetter={documentUpload.setCoverLetter}
            onComplete={documentUpload.handleDocumentConfirm}
            isUploading={documentUpload.isUploading}
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
            onConfirm={onCameraConfirm}
          />
        )
      case 4:
        return (
          <MicStep
            micStatus={micPermission.micStatus}
            audioLevel={micPermission.audioLevel}
            onRequest={micPermission.requestMic}
            onConfirm={onMicConfirm}
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
                  <Button variant="outline" onClick={onRestartPolling} className="cursor-pointer">
                    다시 시도
                  </Button>
                )}
                <Button onClick={onCancel} className="cursor-pointer">
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
  )
}
