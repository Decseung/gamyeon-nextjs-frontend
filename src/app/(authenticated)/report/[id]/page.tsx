import Link from 'next/link'
import { Button } from '@/shared/ui/button'
import { ArrowLeft } from 'lucide-react'
import { ReportHeader } from '@/featured/report/components/ReportHeader'
import { ScoreSummaryCard } from '@/featured/report/components/ScoreSummaryCard'
import { RadarChartSection } from '@/featured/report/components/RadarChartSection'
import { StrengthsWeaknessesSection } from '@/featured/report/components/StrengthsWeaknessesSection'
import { QuestionFeedbackSection } from '@/featured/report/components/QuestionFeedbackSection'
import { DeleteReportButton } from '@/featured/report/components/DeleteReportButton'
import { ScrollToTopButton } from '@/shared/components/ScrollToTopButton'
import { getReportDetailAction } from '@/featured/report/actions/report.action'
import { formatDateKorean } from '@/shared/lib/utils/date'
import { AiConfidenceLevel } from '@/featured/report/types'

interface ReportDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function ReportDetailPage({ params }: ReportDetailPageProps) {
  const { id } = await params
  const intvId = Number(id)
  const response = await getReportDetailAction(intvId)

  //  데이터 조회 실패 시 방어 코드
  if (!response.success || !response.data) {
    return (
      <div className="bg-muted/20 flex min-h-screen flex-col items-center justify-center">
        <p className="text-muted-foreground mb-4 text-lg">리포트 데이터를 불러올 수 없습니다.</p>
        <Button asChild>
          <Link href="/history">목록으로 돌아가기</Link>
        </Button>
      </div>
    )
  }

  const { report } = response.data

  // 방어 로직 추가: report가 null이거나 undefined일 때의 처리
  if (!report) {
    return (
      <div className="bg-muted/20 flex min-h-screen flex-col items-center justify-center">
        <h2 className="mb-4 text-2xl font-bold">리포트를 찾을 수 없습니다</h2>
        <p className="mb-8 text-gray-600">
          면접이 정상적으로 완료되지 않았거나, 분석 중 오류가 발생했습니다.
        </p>
      </div>
    )
  }

  // 데이터가 있으면 포맷팅을 하고, 없으면 임시로 '날짜 정보 없음'이나 null 등으로 처리
  const formattedDate = report.createdAt
    ? formatDateKorean(new Date(report.createdAt))
    : '날짜 정보 없음'

  return (
    <div className="bg-muted/20 min-h-screen">
      <ReportHeader />

      <main className="relative mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="relative mb-8 flex items-center justify-center">
          <div className="absolute left-0">
            <Button
              variant="outline"
              className="gap-2 border-[oklch(0.65_0.15_180)]/30 bg-white text-[oklch(0.65_0.15_180)] hover:bg-[oklch(0.65_0.15_180)]/10 hover:text-[oklch(0.65_0.15_180)]"
              asChild
            >
              <Link href="/history">
                <ArrowLeft className="h-4 w-4" />
                면접 기록 보기
              </Link>
            </Button>
          </div>

          <div className="text-center">
            <h1 className="text-2xl font-bold sm:text-3xl">면접 결과 리포트</h1>
            <p className="text-muted-foreground mt-2">
              {/* 직무 데이터가 있을 때만 렌더링하도록 수정 */}
              {formattedDate} {report.jobCategory && `· ${report.jobCategory}`}
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="h-full lg:col-span-1">
            <ScoreSummaryCard
              overallScore={report.totalScore}
              aiConfidence={report.reportAccuracy as AiConfidenceLevel}
              avgAnswerDurationMs={report.avgAnswerDurationMs}
              answeredCount={report.answeredCount}
              totalQuestionCount={report.questionSummaries.length}
            />
          </div>
          <RadarChartSection data={report.competencyScores} />
        </div>

        <div className="mt-6">
          <StrengthsWeaknessesSection strengths={report.strengths} weaknesses={report.weaknesses} />
        </div>

        <QuestionFeedbackSection feedbacks={report.questionSummaries} />

        <div className="mt-10 flex justify-center">
          <DeleteReportButton intvId={intvId} />
        </div>
      </main>

      <ScrollToTopButton />
    </div>
  )
}
