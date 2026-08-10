'use client'

import { AlertCircle, Calendar, Clock, TrendingUp } from 'lucide-react'
import { InterviewReportItem } from '@/featured/history/types'
import { formatDateDot, formatDuration } from '@/shared/lib/utils/date'
import styles from './CardFluid.module.css'

interface CompletedCardProps {
  record: InterviewReportItem
}

function CompletedCardFront({ record }: CompletedCardProps) {
  return (
    <div className="grid h-full min-h-0 grid-rows-2 overflow-hidden">
      {/* 헤더 그라디언트 영역 */}
      <div
        className={`relative flex min-h-0 items-center overflow-hidden bg-linear-to-tr/srgb from-indigo-500 to-teal-400 text-white ${styles.frontInset}`}
      >
        <div className="w-full">
          <div className={`flex items-end ${styles.scoreRow}`}>
            <span className={`font-bold ${styles.score}`}>{record.report?.totalScore}</span>
            <span className={`opacity-90 ${styles.scoreUnit}`}>점</span>
          </div>
        </div>
      </div>

      {/* 바디 */}
      <div className="grid min-h-0 grid-rows-2 overflow-hidden">
        <div
          className={`flex min-h-0 flex-col justify-center overflow-hidden py-0.5 ${styles.frontHorizontalInset}`}
        >
          <h3 className={`line-clamp-2 leading-tight font-bold text-gray-900 ${styles.title}`}>
            {record.title}
          </h3>
          <p className={`text-gray-500 ${styles.caption}`}>{record.report?.answeredCount}개 질문</p>
        </div>

        <div
          className={`flex min-h-0 flex-col justify-center overflow-hidden py-0.5 ${styles.frontHorizontalInset} ${styles.metaStack}`}
        >
          <div className={`flex items-center text-gray-600 ${styles.meta}`}>
            <Calendar className={`shrink-0 text-blue-500 ${styles.metaIcon}`} />
            <span>{formatDateDot(new Date(record.updatedAt))}</span>
          </div>
          <div className={`flex items-center text-gray-600 ${styles.meta}`}>
            <Clock className={`shrink-0 text-blue-500 ${styles.metaIcon}`} />
            <span>{formatDuration(record.durationSeconds)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
function CompletedCardBack({ record }: CompletedCardProps) {
  const strengths = record.report?.strengths ?? []
  const weaknesses = record.report?.weaknesses ?? []

  return (
    <div
      className={`grid h-full min-h-0 grid-rows-[45fr_45fr_10fr] overflow-hidden bg-white ${styles.back}`}
    >
      {/* 잘한 점 */}
      <div className={`flex min-h-0 flex-col overflow-hidden bg-green-50 ${styles.panel}`}>
        <div className={`flex shrink-0 items-center ${styles.panelHeading}`}>
          <div className={`rounded-full bg-green-500 ${styles.panelIconShell}`}>
            <TrendingUp className={`text-white ${styles.panelIcon}`} />
          </div>
          <p className={`font-semibold text-green-900 ${styles.panelTitle}`}>잘한 점</p>
        </div>
        <ul className={`flex min-h-0 flex-1 flex-col overflow-hidden ${styles.panelList}`}>
          {strengths.length > 0 ? (
            strengths.map((strength: string, idx: number) => (
              <li key={idx} className={`flex items-start ${styles.panelItem}`}>
                <span className={`shrink-0 rounded-full bg-green-600 ${styles.panelBullet}`} />
                <span className={`line-clamp-1 text-green-800 ${styles.panelBody}`}>
                  {strength}
                </span>
              </li>
            ))
          ) : (
            <li className={`text-green-700/70 ${styles.panelBody}`}>분석된 잘한 점이 없습니다</li>
          )}
        </ul>
      </div>

      <div className={`flex min-h-0 flex-col overflow-hidden bg-orange-50 ${styles.panel}`}>
        <div className={`flex shrink-0 items-center ${styles.panelHeading}`}>
          <div className={`rounded-full bg-orange-500 ${styles.panelIconShell}`}>
            <AlertCircle className={`text-white ${styles.panelIcon}`} />
          </div>
          <p className={`font-semibold text-orange-900 ${styles.panelTitle}`}>개선점</p>
        </div>
        <ul className={`flex min-h-0 flex-1 flex-col overflow-hidden ${styles.panelList}`}>
          {weaknesses.length > 0 ? (
            weaknesses.map((weakness: string, idx: number) => (
              <li key={idx} className={`flex items-start ${styles.panelItem}`}>
                <span className={`shrink-0 rounded-full bg-orange-600 ${styles.panelBullet}`} />
                <span className={`line-clamp-1 text-orange-800 ${styles.panelBody}`}>
                  {weakness}
                </span>
              </li>
            ))
          ) : (
            <li className={`text-orange-700/70 ${styles.panelBody}`}>
              개선할 점이 발견되지 않았습니다
            </li>
          )}
        </ul>
      </div>

      <div
        className={`flex min-h-0 items-center justify-center overflow-hidden px-2 text-center text-gray-500 ${styles.backCta}`}
      >
        클릭하여 자세히 보기
      </div>
    </div>
  )
}

export { CompletedCardFront, CompletedCardBack }
