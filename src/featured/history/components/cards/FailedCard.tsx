'use client'

import { AlertTriangle, Calendar } from 'lucide-react'
import { InterviewReportItem } from '@/featured/history/types'
import { formatDateDot } from '@/shared/lib/utils/date'

interface FailedCardProps {
  record: InterviewReportItem
}

export function FailedCard({ record }: FailedCardProps) {
  return (
    <div className="grid h-full min-h-0 grid-rows-2 overflow-hidden">
      {/* 상단 에러 아이콘 영역 */}
      <div className="flex min-h-0 items-center justify-center overflow-hidden bg-linear-to-br from-rose-500 to-red-600 text-white">
        <div className="flex items-center justify-center">
          <div className="rounded-full bg-white/20 p-3 @[280px]:p-5">
            <AlertTriangle className="h-8 w-8 @[280px]:h-12 @[280px]:w-12" aria-hidden="true" />
            <span className="sr-only">오류 발생 아이콘</span>
          </div>
        </div>
      </div>

      {/* 바디 영역 */}
      <div className="grid min-h-0 grid-rows-2 overflow-hidden">
        <div className="flex min-h-0 flex-col justify-center gap-1 overflow-hidden px-5 @[280px]:gap-2 @[280px]:px-8">
          {/* 수정 부분: CompletedCard와 동일하게 라인 클램프 및 높이 고정 적용 */}
          <h3 className="line-clamp-2 h-[2.5em] text-sm leading-tight font-bold text-gray-900 @[280px]:text-lg">
            {record.title}
          </h3>
          <div className="flex items-center gap-1 text-xs text-gray-600 @[280px]:gap-2 @[280px]:text-base">
            <Calendar className="h-4 w-4 shrink-0 text-blue-500 @[280px]:h-5 @[280px]:w-5" />
            <span className="truncate">{formatDateDot(new Date(record.updatedAt))}</span>
          </div>
        </div>

        {/* 에러 메시지 박스 */}
        <div className="min-h-0 overflow-hidden px-5 py-0.5 @[280px]:px-8">
          <div className="flex h-full min-h-0 flex-col justify-center overflow-hidden rounded-md bg-red-50 p-2 @[280px]:rounded-lg @[280px]:p-4">
            <p className="mb-0.5 text-xs leading-tight font-semibold text-red-900 @[280px]:text-sm">
              리포트 발행 실패
            </p>
            <p className="line-clamp-2 text-[10px] leading-tight text-red-700 @[280px]:text-xs">
              면접 데이터 처리 중 오류가 발생했습니다. 관리자에게 문의해주세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
