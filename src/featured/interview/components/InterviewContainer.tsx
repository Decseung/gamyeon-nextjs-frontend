import { ProcessBar } from '@/featured/interview/components/screen/ProcessBar'
import { QuestionBanner } from '@/featured/interview/components/screen/QuestionBanner'
import { VideoArea } from '@/featured/interview/components/screen/VideoArea'
import { TimerWidget } from '@/featured/interview/components/screen/TimerWidget'
import { FinishedOverlay } from '@/featured/interview/components/screen/FinishedOverlay'
import { ControlBar } from '@/featured/interview/components/screen/ControlBar'
import type { useInterview } from '@/featured/interview/hooks/useInterview'

interface InterviewPageProps {
  session: ReturnType<typeof useInterview>
}

export function InterviewContainer({ session }: InterviewPageProps) {
  const currentQuestionSetId =
    session.interviewQuestions[session.currentQuestion]?.questionSetId ?? null

  const handleStopRequest = () => session.setShowEndDialog(true)

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-slate-950 text-white">
      <ProcessBar
        interviewTitle={session.interviewTitle}
        currentQuestion={session.currentQuestion}
        phase={session.phase}
        isActive={session.isActive}
        questions={session.interviewQuestions}
        onEndClick={handleStopRequest}
        onBackClick={handleStopRequest}
      />
      <QuestionBanner
        currentQuestion={session.currentQuestion}
        questions={session.interviewQuestions}
        isActive={session.isActive}
        typingKey={session.typingKey}
        questionRevealed={session.questionRevealed}
        onTypingComplete={() => session.setQuestionRevealed(true)}
      />
      <div className="relative flex flex-1 items-center justify-center overflow-hidden p-4">
        <VideoArea
          cameraOn={session.cameraOn}
          micOn={session.micOn}
          phase={session.phase}
          basePose={session.basePose}
          stream={session.cameraStream}
          intvId={session.interviewId}
          questionSetId={currentQuestionSetId}
        />
        <TimerWidget
          isActive={session.isActive}
          timeLeft={session.timeLeft}
          phase={session.phase}
        />
        <FinishedOverlay phase={session.phase} intvId={session.interviewId!} />
      </div>
      <ControlBar
        micOn={session.micOn}
        cameraOn={session.cameraOn}
        phase={session.phase}
        currentQuestion={session.currentQuestion}
        questionCount={session.interviewQuestions.length}
        onToggleMic={() => session.setMicOn((v) => !v)}
        onToggleCamera={() => session.setCameraOn((v) => !v)}
        onStartInterview={session.startInterview}
        onStartAnswering={session.startAnswering}
        onNext={session.handleNext}
      />
    </div>
  )
}
