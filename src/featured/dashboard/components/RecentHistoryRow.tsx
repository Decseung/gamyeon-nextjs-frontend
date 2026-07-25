import Link from 'next/link'
import { AlertTriangle, ChevronRight, Loader2, RotateCw } from 'lucide-react'
import { InterviewReportItem } from '@/featured/history/types'
import { formatDateDot } from '@/shared/lib/utils/date'
import { getScoreConfig } from '@/featured/report/constants'

interface RecentHistoryRowProps {
  item: InterviewReportItem
}

export function RecentHistoryRow({ item }: RecentHistoryRowProps) {
  const score = item.report?.totalScore
  const reportStatus = item.report?.reportStatus
  const isPaused = item.intvStatus === 'PAUSED'
  const isFailed = reportStatus === 'FAILED'
  const isAnalyzing = reportStatus === 'IN_PROGRESS'
  const hasScore = score !== null && score !== undefined
  const isNonNavigable = isAnalyzing || isFailed

  const inner = (
    <div className="hover:bg-muted/40 flex h-full w-full items-center gap-4 px-5 transition-colors">
      <div
        className={`flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl text-sm font-bold ${
          isPaused
            ? 'bg-green-50 text-green-600'
            : isFailed
              ? 'bg-red-50 text-red-500'
              : hasScore
                ? getScoreConfig(score).style
                : 'bg-slate-100 text-slate-500'
        }`}
      >
        {isPaused ? (
          <RotateCw className="h-4 w-4" />
        ) : isFailed ? (
          <AlertTriangle className="h-4 w-4" />
        ) : isAnalyzing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : hasScore ? (
          score
        ) : (
          '-'
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{item.title}</p>
        {isPaused ? (
          <p className="text-xs text-green-600">중단된 면접</p>
        ) : isFailed ? (
          <p className="text-xs text-red-500">리포트 발행 실패</p>
        ) : isAnalyzing ? (
          <p className="text-xs text-amber-500">AI 리포트 분석 중...</p>
        ) : (
          <p className="text-muted-foreground text-xs">{formatDateDot(new Date(item.updatedAt))}</p>
        )}
      </div>
      {!isNonNavigable && <ChevronRight className="text-muted-foreground h-4 w-4" />}
    </div>
  )

  if (isNonNavigable) {
    return (
      <div className="flex h-18.25 cursor-default flex-col justify-center opacity-70">{inner}</div>
    )
  }

  return (
    <Link
      href={isPaused ? `/interview?restart=true&id=${item.intvId}` : `/report/${item.intvId}`}
      className="flex h-18.25 flex-col justify-center"
      onClick={() => {
        if (isPaused) sessionStorage.setItem('interviewFrom', 'dashboard')
      }}
    >
      {inner}
    </Link>
  )
}
