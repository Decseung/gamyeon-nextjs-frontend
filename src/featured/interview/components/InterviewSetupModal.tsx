'use client'

import { Button } from '@/shared/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/shared/ui/dialog'
import { SetupFooter } from '@/featured/interview/components/setup/SetupFooter'
import { SetupSidebar } from '@/featured/interview/components/setup/SetupSidebar'
import { SetupStepContainer } from '@/featured/interview/components/setup/SetupStepContainer'
import { useSetupModal } from '@/featured/interview/hooks/useSetupModal'
import type { useInterview } from '@/featured/interview/hooks/useInterview'

interface InterviewSetupModalProps {
  session: ReturnType<typeof useInterview>
  isRestart?: boolean
}

const RESUME_LOCKED_STEPS = [1, 2]
const STEP2_LOCKED = [2]

export function InterviewSetupModal({ session, isRestart = false }: InterviewSetupModalProps) {
  const {
    currentStep,
    maxReachedStep,
    navigateToStep,
    statuses,
    doneCount,
    isStep2Locked,
    loadingTextIndex,
    isQuestionsReady,
    isFailed,
    isRetryableFailure,
    status,
    restartPolling,
    cameraHandler,
    micPermission,
    micRecorder,
    documentUpload,
    titleStep,
    handleCancel,
    handleCameraConfirm,
    handleMicConfirm,
    handleStart,
    isStartDisabled,
  } = useSetupModal({ session, isRestart })

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
              onStepClick={(step) =>
                navigateToStep(step, () => void titleStep.syncInterviewTitle())
              }
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
                  <SetupStepContainer
                    currentStep={currentStep}
                    loadingTextIndex={loadingTextIndex}
                    isQuestionsReady={isQuestionsReady}
                    isFailed={isFailed}
                    isRetryableFailure={isRetryableFailure}
                    status={status}
                    cameraHandler={cameraHandler}
                    micPermission={micPermission}
                    micRecorder={micRecorder}
                    documentUpload={documentUpload}
                    titleStep={titleStep}
                    onCameraConfirm={handleCameraConfirm}
                    onMicConfirm={handleMicConfirm}
                    onCancel={handleCancel}
                    onRestartPolling={restartPolling}
                  />
                </div>
                <SetupFooter
                  disabled={isStartDisabled}
                  onCancel={handleCancel}
                  onStart={handleStart}
                />
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
