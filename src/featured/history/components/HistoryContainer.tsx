'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Card } from '@/shared/ui/card'
import { FileText, Inbox } from 'lucide-react'
import { InterviewReportItem } from '@/featured/history/types'
import { getReportCardType } from '@/featured/history/constants'
import { CardContainer } from '@/featured/history/components/cards/CardContainer'
import {
  CompletedCardBack,
  CompletedCardFront,
} from '@/featured/history/components/cards/CompletedCard'
import { FailedCard } from '@/featured/history/components/cards/FailedCard'
import { PendingCard } from './cards/PendingCard'
import { AnalysingCard } from './cards/AnalysingCard'
import { trackEvent } from '@/shared/lib/utils/analytics'
import { useRageClick } from '../hooks/useRageClick'

interface HistoryContainerProps {
  records: InterviewReportItem[]
  search: string
  currentPage: number
  itemsPerPage: number
}

interface FlipCardProps {
  record: InterviewReportItem
}

function FlipCard({ record }: FlipCardProps) {
  const router = useRouter()
  const [isHovered, setIsHovered] = useState(false)

  const cardType = getReportCardType(record.intvStatus, record.report?.reportStatus)

  const prevCardType = useRef<string | null>(null)

  const isCompleted = cardType === 'completedCard'
  const isAnalysing = cardType === 'analysingCard'

  // AI 리포트 대기 마찰률: 리포트 단위 기준
  const reportId = record.report?.reportId

  useEffect(() => {
    if (cardType === 'analysingCard' && prevCardType.current !== 'analysingCard' && reportId) {
      trackEvent('report_gen_start', {
        category: 'ai_report',
        report_id: reportId,
      })

      const waitingSessionKey = `report_waiting_session:${reportId}`

      // 마찰률의 분모 이벤트, 같은 리포트 대기 건은 세션 내 1회만 잡음
      if (!sessionStorage.getItem(waitingSessionKey)) {
        sessionStorage.setItem(waitingSessionKey, 'true')

        trackEvent('report_waiting_session', {
          category: 'ai_report',
          report_id: reportId,
          page: 'history',
          status: 'generating',
        })
      }
    }

    if (prevCardType.current === 'analysingCard' && cardType === 'completedCard' && reportId) {
      trackEvent('report_gen_complete', {
        category: 'ai_report',
        report_id: reportId,
      })
    }

    prevCardType.current = cardType
  }, [cardType, reportId])

  const handleRageClick = useCallback(() => {
    if (!isAnalysing || !reportId) return

    // 분석 중 카드에서 2초 내 3회 클릭  감지되면 마찰 이벤트로 전송
    trackEvent(
      'report_waiting_rage_click',
      {
        category: 'user_frustration',
        report_id: reportId,
        page: 'history',
        status: 'generating',
        click_count: 3,
        window_ms: 2000,
      },
      { clarity: true },
    )
  }, [isAnalysing, reportId])

  // 분노의 클릭 카운트 : 분석 중 카드 클릭에서만 수행
  const { registerRageClick } = useRageClick(handleRageClick)

  if (!cardType) return null

  // 카드 상태에 따라 완료 카드는 상세로 이동하고, 분석 중 카드는 rage click 후보로 등록
  const handleCardClick = () => {
    if (isCompleted) {
      router.push(`/report/${record.intvId}`)
      return
    }

    if (isAnalysing) {
      registerRageClick()
    }
  }

  return (
    <div
      onClick={handleCardClick}
      onMouseEnter={() => {
        if (isCompleted) {
          setIsHovered(true)
        }
      }}
      onMouseLeave={() => {
        if (isCompleted) {
          setIsHovered(false)
        }
      }}
      className={`h-full w-full ${isCompleted ? 'cursor-pointer' : 'cursor-default'}`}
    >
      <CardContainer isHovered={isHovered}>
        <Card className="absolute inset-0 flex flex-col overflow-hidden backface-hidden">
          {cardType === 'completedCard' && <CompletedCardFront record={record} />}
          {cardType === 'pendingCard' && <PendingCard intvId={record.intvId} />}
          {cardType === 'analysingCard' && <AnalysingCard />}
          {cardType === 'failedCard' && <FailedCard record={record} />}
        </Card>

        {isCompleted && (
          <Card
            className="absolute inset-0 overflow-hidden antialiased backface-hidden"
            style={{ transform: 'rotateY(180deg) translateZ(1px)' }}
          >
            <CompletedCardBack record={record} />
          </Card>
        )}
      </CardContainer>
    </div>
  )
}

export function HistoryContainer({
  records,
  search,
  currentPage,
  itemsPerPage,
}: HistoryContainerProps) {
  const start = (currentPage - 1) * itemsPerPage
  const pageRecords = records.slice(start, start + itemsPerPage)

  if (records.length === 0) {
    if (search) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex min-h-[calc(100vh-250px)] flex-col items-center justify-center text-center"
        >
          <div className="bg-muted mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl">
            <FileText className="text-muted-foreground h-7 w-7" />
          </div>
          <h3 className="mb-1 text-lg font-semibold">기록이 없습니다</h3>
          <p className="text-muted-foreground mb-6 text-sm">
            검색 결과가 없습니다. 다른 키워드로 검색해보세요.
          </p>
        </motion.div>
      )
    }

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex min-h-[calc(100vh-250px)] flex-col items-center justify-center text-center"
      >
        <Link
          href="/interview"
          className="group flex cursor-pointer flex-col items-center justify-center"
        >
          <div className="bg-primary/10 text-primary mb-6 rounded-full p-4 transition-transform duration-300 group-hover:scale-110">
            <Inbox className="h-8 w-8" />
          </div>

          <div className="mb-8 flex flex-col items-center gap-1.5">
            <h3 className="text-foreground text-xl font-bold">진행된 면접 기록이 없습니다.</h3>
            <p className="text-muted-foreground text-sm">
              아직 면접 연습 기록이 없습니다. 첫 면접을 시작해보세요!
            </p>
          </div>

          <span className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center rounded-md px-8 py-3 text-base font-semibold shadow-sm transition-colors">
            첫 면접 시작하기 &rarr;
          </span>
        </Link>
      </motion.div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-5">
      {pageRecords.map((record, i) => (
        <motion.div
          key={record.intvId}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05, duration: 0.4 }}
        >
          <FlipCard record={record} />
        </motion.div>
      ))}
    </div>
  )
}
