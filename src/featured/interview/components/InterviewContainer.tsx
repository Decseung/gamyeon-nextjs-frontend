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

  const currentQuestionOrder =
    session.interviewQuestions[session.currentQuestion]?.questionOrder ?? 0

  const handleStopRequest = () => session.setShowEndDialog(true)

  const processBarQuestions = session.restartContext
    ? session.restartContext.questions
        .slice()
        .sort((a, b) => a.questionOrder - b.questionOrder)
        .map((q) => {
          const answeredInCurrentSession = session.interviewQuestions
            .slice(0, session.currentQuestion)
            .some((iq) => iq.questionSetId === q.questionSetId)
          const isCurrentQuestion =
            session.interviewQuestions[session.currentQuestion]?.questionSetId === q.questionSetId
          return {
            questionSetId: q.questionSetId,
            questionOrder: q.questionOrder,
            status:
              q.answered || answeredInCurrentSession
                ? ('completed' as const)
                : isCurrentQuestion && session.isActive
                  ? ('active' as const)
                  : ('pending' as const),
          }
        })
    : session.interviewQuestions.map((q, i) => ({
        questionSetId: q.questionSetId,
        questionOrder: q.questionOrder,
        status:
          i < session.currentQuestion
            ? ('completed' as const)
            : i === session.currentQuestion && session.isActive
              ? ('active' as const)
              : ('pending' as const),
      }))

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-slate-950 text-white">
      <ProcessBar
        interviewTitle={session.interviewTitle}
        currentQuestionOrder={currentQuestionOrder}
        phase={session.phase}
        questions={processBarQuestions}
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
