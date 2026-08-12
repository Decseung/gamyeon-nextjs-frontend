'use client'

import { AlertCircle, Calendar, Clock, TrendingUp } from 'lucide-react'
import { InterviewReportItem } from '@/featured/history/types'
import { formatDateDot, formatDuration } from '@/shared/lib/utils/date'

interface CompletedCardProps {
  record: InterviewReportItem
}

function CompletedCardFront({ record }: CompletedCardProps) {
  return (
    <div className="grid h-full min-h-0 grid-rows-2 overflow-hidden">
      {/* 헤더 그라디언트 영역 */}
      <div className="relative flex min-h-0 items-center overflow-hidden bg-linear-to-tr/srgb from-indigo-500 to-teal-400 p-3 text-white @[280px]:p-6">
        <div className="w-full">
          <div className="flex items-end gap-1 @[280px]:gap-2">
            <span className="text-4xl font-bold @[280px]:text-6xl">
              {record.report?.totalScore}
            </span>
            <span className="mb-1 text-lg opacity-90 @[280px]:mb-2 @[280px]:text-2xl">점</span>
          </div>
        </div>
      </div>

      {/* 바디 */}
      <div className="grid min-h-0 grid-rows-2 overflow-hidden">
        <div className="flex min-h-0 flex-col justify-center overflow-hidden px-3 py-0.5 @[280px]:px-6">
          <h3 className="mb-0.5 line-clamp-2 text-sm leading-tight font-bold text-gray-900 @[280px]:mb-1 @[280px]:text-xl">
            {record.title}
          </h3>
          <p className="text-[10px] text-gray-500 @[280px]:text-sm">
            {record.report?.answeredCount}개 질문
          </p>
        </div>

        <div className="flex min-h-0 flex-col justify-center gap-1 overflow-hidden px-3 py-0.5 @[280px]:gap-3 @[280px]:px-6">
          <div className="flex items-center gap-1 text-xs text-gray-600 @[280px]:gap-2 @[280px]:text-base">
            <Calendar className="h-3.5 w-3.5 shrink-0 text-blue-500 @[280px]:h-5 @[280px]:w-5" />
            <span>{formatDateDot(new Date(record.updatedAt))}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-600 @[280px]:gap-2 @[280px]:text-base">
            <Clock className="h-3.5 w-3.5 shrink-0 text-blue-500 @[280px]:h-5 @[280px]:w-5" />
            <span>{formatDuration(record.durationSeconds)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
function CompletedCardBack({ record }: CompletedCardProps) {
  const strengths = (record.report?.strengths ?? []).slice(0, 3)
  const weaknesses = (record.report?.weaknesses ?? []).slice(0, 3)

  return (
    <div className="grid h-full min-h-0 grid-rows-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-2 overflow-hidden bg-white p-3 @[280px]:gap-3 @[280px]:p-4">
      {/* 잘한 점 */}
      <div className="flex min-h-0 flex-col overflow-hidden rounded-md bg-green-50 p-2 @[280px]:rounded-lg @[280px]:p-3">
        <div className="mb-0.5 flex shrink-0 items-center gap-1 @[280px]:mb-1 @[280px]:gap-2">
          <div className="rounded-full bg-green-500 p-0.5 @[280px]:p-1">
            <TrendingUp className="h-2.5 w-2.5 text-white @[280px]:h-3 @[280px]:w-3" />
          </div>
          <p className="text-xs font-semibold text-green-900 @[280px]:text-sm">잘한 점</p>
        </div>
        <ul className="grid min-h-0 flex-1 grid-rows-3 gap-0.5 overflow-hidden @[280px]:gap-1">
          {strengths.length > 0 ? (
            strengths.map((strength: string, idx: number) => (
              <li key={idx} className="flex min-h-0 items-center gap-1.5">
                <span className="h-1 w-1 shrink-0 rounded-full bg-green-600" />
                <span className="line-clamp-1 text-[10px] leading-3.5 text-green-800 @[280px]:text-xs @[280px]:leading-4">
                  {strength}
                </span>
              </li>
            ))
          ) : (
            <li className="text-[10px] text-green-700/70 @[280px]:text-xs">
              분석된 잘한 점이 없습니다
            </li>
          )}
        </ul>
      </div>

      <div className="flex min-h-0 flex-col overflow-hidden rounded-md bg-orange-50 p-2 @[280px]:rounded-lg @[280px]:p-3">
        <div className="mb-0.5 flex shrink-0 items-center gap-1 @[280px]:mb-1 @[280px]:gap-2">
          <div className="rounded-full bg-orange-500 p-0.5 @[280px]:p-1">
            <AlertCircle className="h-2.5 w-2.5 text-white @[280px]:h-3 @[280px]:w-3" />
          </div>
          <p className="text-xs font-semibold text-orange-900 @[280px]:text-sm">개선점</p>
        </div>
        <ul className="grid min-h-0 flex-1 grid-rows-3 gap-0.5 overflow-hidden @[280px]:gap-1">
          {weaknesses.length > 0 ? (
            weaknesses.map((weakness: string, idx: number) => (
              <li key={idx} className="flex min-h-0 items-center gap-1.5">
                <span className="h-1 w-1 shrink-0 rounded-full bg-orange-600" />
                <span className="line-clamp-1 text-[10px] leading-3.5 text-orange-800 @[280px]:text-xs @[280px]:leading-4">
                  {weakness}
                </span>
              </li>
            ))
          ) : (
            <li className="text-[10px] text-orange-700/70 @[280px]:text-xs">
              개선할 점이 발견되지 않았습니다
            </li>
          )}
        </ul>
      </div>

      <div className="flex min-h-0 items-center justify-center overflow-hidden px-2 text-center text-[10px] text-gray-500 @[280px]:text-xs">
        클릭하여 자세히 보기
      </div>
    </div>
  )
}

export { CompletedCardFront, CompletedCardBack }
