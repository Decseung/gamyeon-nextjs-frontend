'use client'

import { AlertCircle, Calendar, Clock, TrendingUp } from 'lucide-react'
import { InterviewReportItem } from '@/featured/history/types'
import { formatDateDot, formatDuration } from '@/shared/lib/utils/date'

interface CompletedCardProps {
  record: InterviewReportItem
}

function CompletedCardFront({ record }: CompletedCardProps) {
  return (
    <div>
      {/* 헤더 그라디언트 영역 */}
      <div className="relative bg-linear-to-tr/srgb from-indigo-500 to-teal-400 p-2 pb-5 text-white @[180px]:p-3 @[180px]:pb-6 @[220px]:p-4 @[220px]:pb-8 @[280px]:p-6 @[280px]:pb-10">
        <div className="mt-2 @[180px]:mt-3 @[220px]:mt-5 @[280px]:mt-8">
          <div className="mb-1 flex items-end gap-1 @[180px]:gap-1.5 @[220px]:mb-2 @[220px]:gap-2">
            <span className="text-2xl font-bold @[180px]:text-3xl @[220px]:text-4xl @[280px]:text-5xl">
              {record.report?.totalScore}
            </span>
            <span className="mb-0.5 text-base opacity-90 @[180px]:mb-1 @[180px]:text-lg @[220px]:text-xl @[280px]:mb-2 @[280px]:text-2xl">
              점
            </span>
          </div>
        </div>
      </div>

      {/* 바디 */}
      <div className="flex flex-1 flex-col justify-between px-2 py-3 @[180px]:px-3 @[180px]:py-4 @[220px]:px-4 @[220px]:py-5 @[280px]:px-6 @[280px]:py-8">
        <div className="space-y-1.5 @[180px]:space-y-2 @[220px]:space-y-3 @[280px]:space-y-4">
          <div>
            {/* 수정 부분: 높이(h)를 고정하여 1줄일 때나 2줄일 때나 레이아웃이 동일하게 유지되도록 설정, 2줄 이상은 말줄임 처리 */}
            <h3 className="mb-0.5 line-clamp-2 h-[2.5em] text-[11px] leading-tight font-bold text-gray-900 @[180px]:text-xs @[220px]:text-sm @[280px]:mb-1 @[280px]:text-base">
              {record.title}
            </h3>
            <p className="text-[9px] text-gray-500 @[180px]:text-[10px] @[220px]:text-xs">
              {record.report?.answeredCount}개 질문
            </p>
          </div>
          <div className="space-y-1 py-1 @[180px]:space-y-1.5 @[220px]:space-y-2 @[220px]:py-1.5 @[280px]:py-2">
            <div className="flex items-center gap-1 text-[10px] text-gray-600 @[180px]:gap-1.5 @[180px]:text-[11px] @[220px]:gap-2 @[220px]:text-xs @[280px]:text-sm">
              <Calendar className="h-2.5 w-2.5 shrink-0 text-blue-500 @[180px]:h-3 @[180px]:w-3 @[220px]:h-3.5 @[220px]:w-3.5 @[280px]:h-4 @[280px]:w-4" />
              <span>{formatDateDot(new Date(record.updatedAt))}</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-gray-600 @[180px]:gap-1.5 @[180px]:text-[11px] @[220px]:gap-2 @[220px]:text-xs @[280px]:text-sm">
              <Clock className="h-2.5 w-2.5 shrink-0 text-blue-500 @[180px]:h-3 @[180px]:w-3 @[220px]:h-3.5 @[220px]:w-3.5 @[280px]:h-4 @[280px]:w-4" />
              <span>{formatDuration(record.durationSeconds)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
// 뒷면 생략 (변경 없음)
function CompletedCardBack({ record }: CompletedCardProps) {
  const strengths = record.report?.strengths ?? []
  const weaknesses = record.report?.weaknesses ?? []

  return (
    <div className="flex h-full flex-col p-2 @[180px]:p-3 @[220px]:p-4 @[280px]:p-6">
      <div className="flex flex-1 flex-col gap-1.5 @[180px]:gap-2 @[220px]:gap-2.5 @[280px]:gap-4">
        {/* 잘한 점 */}
        <div className="flex flex-1 flex-col rounded-md bg-green-50 p-2 @[180px]:p-3 @[220px]:rounded-lg @[220px]:p-3.5 @[280px]:p-5">
          <div className="mb-1 flex items-center gap-1 @[180px]:gap-1.5 @[220px]:mb-1.5 @[220px]:gap-2">
            <div className="rounded-full bg-green-500 p-0.5 @[220px]:p-1">
              <TrendingUp className="h-2 w-2 text-white @[220px]:h-2.5 @[220px]:w-2.5 @[280px]:h-3 @[280px]:w-3" />
            </div>
            <p className="text-[9px] font-semibold text-green-900 @[180px]:text-[10px] @[220px]:text-xs @[280px]:text-sm">
              잘한 점
            </p>
          </div>
          <ul className="space-y-0.5 overflow-hidden @[180px]:space-y-1 @[220px]:space-y-1.5">
            {strengths.length > 0 ? (
              strengths.map((strength: string, idx: number) => (
                <li key={idx} className="flex items-start gap-1 @[180px]:gap-1.5">
                  <span className="mt-1 h-0.5 w-0.5 shrink-0 rounded-full bg-green-600 @[180px]:h-1 @[180px]:w-1" />
                  <span className="line-clamp-1 text-[9px] text-green-800 @[180px]:text-[10px] @[220px]:text-xs">
                    {strength}
                  </span>
                </li>
              ))
            ) : (
              <li className="text-[9px] text-green-700/70 @[180px]:text-[10px] @[220px]:text-xs">
                분석된 잘한 점이 없습니다
              </li>
            )}
          </ul>
        </div>

        <div className="flex flex-1 flex-col rounded-md bg-orange-50 p-2 @[180px]:p-3 @[220px]:rounded-lg @[220px]:p-3.5 @[280px]:p-5">
          <div className="mb-1 flex items-center gap-1 @[180px]:gap-1.5 @[220px]:mb-1.5 @[220px]:gap-2">
            <div className="rounded-full bg-orange-500 p-0.5 @[220px]:p-1">
              <AlertCircle className="h-2 w-2 text-white @[220px]:h-2.5 @[220px]:w-2.5 @[280px]:h-3 @[280px]:w-3" />
            </div>
            <p className="text-[9px] font-semibold text-orange-900 @[180px]:text-[10px] @[220px]:text-xs @[280px]:text-sm">
              개선점
            </p>
          </div>
          <ul className="space-y-0.5 overflow-hidden @[180px]:space-y-1 @[220px]:space-y-1.5">
            {weaknesses.length > 0 ? (
              weaknesses.map((weakness: string, idx: number) => (
                <li key={idx} className="flex items-start gap-1 @[180px]:gap-1.5">
                  <span className="mt-1 h-0.5 w-0.5 shrink-0 rounded-full bg-orange-600 @[180px]:h-1 @[180px]:w-1" />
                  <span className="line-clamp-1 text-[9px] text-orange-800 @[180px]:text-[10px] @[220px]:text-xs">
                    {weakness}
                  </span>
                </li>
              ))
            ) : (
              <li className="text-[9px] text-orange-700/70 @[180px]:text-[10px] @[220px]:text-xs">
                개선할 점이 발견되지 않았습니다
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="mt-1.5 text-center text-[8px] text-gray-500 @[180px]:mt-2 @[180px]:text-[9px] @[220px]:mt-2.5 @[220px]:text-[10px] @[280px]:mt-4 @[280px]:text-xs">
        클릭하여 자세히 보기
      </div>
    </div>
  )
}

export { CompletedCardFront, CompletedCardBack }
