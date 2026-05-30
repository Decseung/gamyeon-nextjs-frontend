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

  // 카드 상태 분리
  const isCompleted = cardType === 'completedCard'
  const isAnalysing = cardType === 'analysingCard'

  // 이벤트 payload에서 반복해서 쓸 id 분리
  const reportId = record.report?.reportId
  const intvId = record.intvId

  useEffect(() => {
    if (cardType === 'analysingCard' && prevCardType.current !== 'analysingCard') {
      // 기존 이벤트 유지
      trackEvent('report_gen_start', {
        category: 'ai_report',
      })

      // 백오피스 마찰률 분모 이벤트
      // 전체 리포트 대기 세션 수를 계산할 때 사용
      trackEvent('report_waiting_session', {
        category: 'ai_report',
        report_id: reportId ?? '',
        intv_id: intvId,
        page: 'history',
        status: 'generating',
      })
    }

    if (prevCardType.current === 'analysingCard' && cardType === 'completedCard') {
      trackEvent('report_gen_complete', {
        category: 'ai_report',
      })
    }

    prevCardType.current = cardType
  }, [cardType, reportId, intvId])

  // 분석 중 카드에서만 분노 클릭 이벤트 전송
  const handleRageClick = useCallback(() => {
    if (!isAnalysing) return

    // 백오피스 마찰률 분자 이벤트
    // "2초 안에 3번 클릭"이 감지됐을 때만 실행됨
    trackEvent('report_waiting_rage_click', {
      category: 'user_frustration',
      report_id: reportId ?? '',
      intv_id: intvId,
      page: 'history',
      status: 'generating',
      click_count: 3,
      window_ms: 2000,
    })

    // Clarity 스마트 이벤트명도 백오피스 기준과 맞춤
    if (typeof window !== 'undefined' && typeof window.clarity === 'function') {
      window.clarity('event', 'report_waiting_rage_click')
    }
  }, [isAnalysing, reportId, intvId])

  // useRageClick을 FlipCard 내부로 이동
  // React 훅 규칙상 조건문 안에서 호출하면 안 되므로 항상 호출하고,
  // 실제 실행은 handleCardClick에서 isAnalysing일 때만 함
  const { handleContainerClick } = useRageClick(handleRageClick)

  if (!cardType) return null

  // 완료 카드 클릭과 분석 중 카드 클릭을 하나의 핸들러에서 분기
  const handleCardClick = () => {
    if (isCompleted) {
      router.push(`/report/${record.intvId}`)
      return
    }

    // 분석 중 카드일 때만 rage click 카운트 증가
    if (isAnalysing) {
      handleContainerClick()
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
