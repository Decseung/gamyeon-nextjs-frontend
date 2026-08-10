'use client'

import { AlertTriangle, Calendar } from 'lucide-react'
import { InterviewReportItem } from '@/featured/history/types'
import { formatDateDot } from '@/shared/lib/utils/date'
import styles from './CardFluid.module.css'

interface FailedCardProps {
  record: InterviewReportItem
}

export function FailedCard({ record }: FailedCardProps) {
  return (
    <div className="grid h-full min-h-0 grid-rows-2 overflow-hidden">
      {/* 상단 에러 아이콘 영역 */}
      <div className="flex min-h-0 items-center justify-center overflow-hidden bg-linear-to-br from-rose-500 to-red-600 text-white">
        <div className="flex items-center justify-center">
          <div className={`rounded-full bg-white/20 ${styles.failedBadge}`}>
            <AlertTriangle className={styles.statusIcon} aria-hidden="true" />
            <span className="sr-only">오류 발생 아이콘</span>
          </div>
        </div>
      </div>

      {/* 바디 영역 */}
      <div className="grid min-h-0 grid-rows-2 overflow-hidden">
        <div
          className={`flex min-h-0 flex-col justify-center overflow-hidden ${styles.failedBodyInset} ${styles.failedSection}`}
        >
          {/* 수정 부분: CompletedCard와 동일하게 라인 클램프 및 높이 고정 적용 */}
          <h3
            className={`line-clamp-2 h-[2.5em] leading-tight font-bold text-gray-900 ${styles.failedTitle}`}
          >
            {record.title}
          </h3>
          <div className={`flex items-center text-gray-600 ${styles.failedMeta}`}>
            <Calendar className={`shrink-0 text-blue-500 ${styles.failedMetaIcon}`} />
            <span className="truncate">{formatDateDot(new Date(record.updatedAt))}</span>
          </div>
        </div>

        {/* 에러 메시지 박스 */}
        <div className={`min-h-0 overflow-hidden py-0.5 ${styles.failedBodyInset}`}>
          <div
            className={`flex h-full min-h-0 flex-col justify-center overflow-hidden bg-red-50 ${styles.errorBox}`}
          >
            <p className={`mb-0.5 leading-tight font-semibold text-red-900 ${styles.errorTitle}`}>
              리포트 발행 실패
            </p>
            <p className={`line-clamp-2 leading-tight text-red-700 ${styles.errorCopy}`}>
              면접 데이터 처리 중 오류가 발생했습니다. 관리자에게 문의해주세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
