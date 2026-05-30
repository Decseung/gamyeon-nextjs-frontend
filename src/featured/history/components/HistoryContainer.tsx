'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
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

// 3. 테스트용 목데이터 (이어하기 테스트 명확화 및 상태값 적용)
// const MOCK_RECORDS: InterviewReportItem[] = [
//   {
//     intvId: 1,
//     intvTitle: '프론트엔드 직무 면접 (분석 완료 테스트)',
//     intvStatus: 'FINISHED',
//     durationMs: 3600000,
//     updatedAt: '2026-03-15T10:00:00Z',
//     report: {
//       reportId: 101,
//       reportStatus: 'SUCCEED',
//       totalScore: 85,
//       answeredCount: 5,
//       strengths: ['React', 'TypeScript'],
//       weaknesses: ['CS 지식'],
//     },
//   },
//   {
//     intvId: 2,
//     intvTitle: '프론트엔드 직무 면접 (분석 중 테스트)',
//     intvStatus: 'FINISHED',
//     durationMs: 2400000,
//     updatedAt: '2026-03-15T11:00:00Z',
//     report: {
//       reportId: 102,
//       reportStatus: 'IN_PROGRESS',
//       totalScore: null,
//       answeredCount: 4,
//       strengths: null,
//       weaknesses: null,
//     },
//   },
//   {
//     intvId: 3,
//     intvTitle: '프론트엔드 직무 면접 (분석 실패 테스트)',
//     intvStatus: 'FINISHED',
//     durationMs: 1800000,
//     updatedAt: '2026-03-15T12:00:00Z',
//     report: {
//       reportId: 103,
//       reportStatus: 'FAILED',
//       totalScore: null,
//       answeredCount: 2,
//       strengths: null,
//       weaknesses: null,
//     },
//   },
//   {
//     intvId: 4,
//     intvTitle: '프론트엔드 직무 면접 (이어하기 UI 테스트)',
//     intvStatus: 'PAUSED',
//     durationMs: null,
//     updatedAt: '2026-03-15T13:00:00Z',
//     report: null,
//   },
//   {
//     // 테스트: 이 카드가 화면에서 아예 사라지는지 확인합니다
//     intvId: 5,
//     intvTitle: 'READY 상태 테스트',
//     intvStatus: 'READY',
//     durationMs: null,
//     updatedAt: '2026-03-15T13:00:00Z',
//     report: null,
//   },
// ]

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

  // 상태 감별사 함수로 무슨 카드 보여줄지 결정
  const cardType = getReportCardType(record.intvStatus, record.report?.reportStatus)

  // 초기값을 null로 설정하여 과거 상태를 비워둡니다.
  // 방금 화면에 들어왔습니다. 메모장은 비어있습니다. (prevCardType.current === null)
  const prevCardType = useRef<string | null>(null)

  useEffect(() => {
    // 1. 리포트 생성 시작 시 (Start)
    if (cardType === 'analysingCard' && prevCardType.current !== 'analysingCard') {
      trackEvent('report_gen_start', { category: 'ai_report' })
    }

    // 2. 리포트 생성 완료 시 (Complete)
    if (prevCardType.current === 'analysingCard' && cardType === 'completedCard') {
      trackEvent('report_gen_complete', { category: 'ai_report' })
    }

    // 다음 상태 비교를 위해, 현재 상태를 '과거'로 메모지에 적어둠
    prevCardType.current = cardType
  }, [cardType])

  //  보여줄 카드 타입이 없으면(null) 렌더링을 중단하고 아무것도 안 그림
  if (!cardType) return null
  const isCompleted = cardType === 'completedCard'

  const handleClick = () => {
    // 분석 완료 카드만 상세 페이지로 이동 가능
    if (isCompleted) {
      router.push(`/report/${record.intvId}`)
    }
  }

  return (
    <div
      onClick={handleClick}
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
  // 면접 데이터 없게 들어오는지 test
  console.log('실제 API에서 넘어온 면접 데이터:', records)

  const start = (currentPage - 1) * itemsPerPage

  // 잠시 테스트를 위해 records 대신 MOCK_RECORDS를 사용하도록 변경
  // const pageRecords = MOCK_RECORDS.slice(start, start + itemsPerPage)
  // 테스트가 끝나면 다시 records로
  const pageRecords = records.slice(start, start + itemsPerPage)

  // 1. 현재 화면에 'AI 리포트 분석 중'인 카드가 한 개라도 존재하는지 실시간 체크
  const hasAnalysingCard = pageRecords.some(
    (record) =>
      getReportCardType(record.intvStatus, record.report?.reportStatus) === 'analysingCard',
  )

  // 2. 분노 클릭 조건 만족 시 실행할 통합 전송 핸들러
  const handleRageClick = () => {
    // 분석 중인 카드가 화면에 있을 때만 이벤트를 발송합니다.
    if (!hasAnalysingCard) return

    // [GA4 전송] - 명세서에 등록한 'rage_click' 이벤트 발송
    trackEvent('rage_click', {
      category: 'user_frustration',
      label: 'ai_report_waiting',
      screen_name: 'history_page_global',
    })

    // [MS Clarity 스마트 연동] - 대시보드 커스텀 필터용 타겟팅 이벤트
    if (typeof window !== 'undefined' && 'clarity' in window) {
      const clarityApi = window.clarity as (event: string, name: string) => void
      clarityApi('event', 'rage_click')
    }

    console.log('[통합 전송 완료] GA4: rage_click / Clarity: rage_click')
  }

  //  3. useRageClick 훅 활용
  const { handleContainerClick } = useRageClick(handleRageClick)

  // 수정 전:
  if (records.length === 0) {
    // 수정 후: 목데이터를 기준으로 빈 화면인지 체크하도록 변경
    // if (pageRecords.length === 0) {
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
    <div
      onClick={handleContainerClick}
      className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-5"
    >
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
