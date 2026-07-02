'use client'

import { useCallback, useEffect, useRef, useState, useLayoutEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/shared/ui/card'
import { InterviewReportItem } from '@/featured/history/types'
import { getReportCardType } from '@/featured/history/constants'
import { CardContainer } from '@/featured/history/components/cards/CardContainer'
import {
  CompletedCardBack,
  CompletedCardFront,
} from '@/featured/history/components/cards/CompletedCard'
import { FailedCard } from '@/featured/history/components/cards/FailedCard'
import { PendingCard } from '@/featured/history/components/cards/PendingCard'
import { AnalysingCard } from '@/featured/history/components/cards/AnalysingCard'
import { trackEvent } from '@/shared/lib/utils/analytics'
import { useRageClick } from '@/featured/history/hooks/useRageClick'

interface FlipCardProps {
  record: InterviewReportItem
}

export function FlipCard({ record }: FlipCardProps) {
  const router = useRouter()
  const [isHovered, setIsHovered] = useState(false)

  const cardType = getReportCardType(record.intvStatus, record.report?.reportStatus)

  const prevCardType = useRef<string | null>(null)
  const latestCardTypeRef = useRef<string | null>(cardType)
  const analysingMountedAtRef = useRef<number | null>(null)
  const reportCompletedRef = useRef(false)
  const hiddenOccurredRef = useRef(false)
  const earlyExitSentRef = useRef(false)
  const analysingEffectRunRef = useRef(0) // 현재 대기 경험의 UUID 저장
  const waitingSessionIdRef = useRef<string | null>(null) //StrictMode 점검용 cleanup 구분

  const isCompleted = cardType === 'completedCard'
  const isAnalysing = cardType === 'analysingCard'

  // AI 리포트 대기 마찰률: 리포트 단위 기준
  const reportId = record.report?.reportId

  useLayoutEffect(() => {
    latestCardTypeRef.current = cardType
  }, [cardType])

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
      reportCompletedRef.current = true

      trackEvent('report_gen_complete', {
        category: 'ai_report',
        report_id: reportId,
      })
    }

    prevCardType.current = cardType
  }, [cardType, reportId])

  useEffect(() => {
    if (!isAnalysing || !reportId) return

    analysingMountedAtRef.current = Date.now()
    reportCompletedRef.current = false
    hiddenOccurredRef.current = document.hidden
    earlyExitSentRef.current = false

    return () => {
      const mountedAt = analysingMountedAtRef.current
      analysingMountedAtRef.current = null

      if (!mountedAt) return
      if (earlyExitSentRef.current) return
      if (reportCompletedRef.current || latestCardTypeRef.current === 'completedCard') return
      if (hiddenOccurredRef.current) return

      const elapsedMs = Date.now() - mountedAt
      if (elapsedMs > 10000) return

      const earlyExitKey = `report_waiting_early_exit:${reportId}`
      if (sessionStorage.getItem(earlyExitKey)) return

      sessionStorage.setItem(earlyExitKey, 'true')
      earlyExitSentRef.current = true

      trackEvent('report_waiting_early_exit', {
        category: 'ai_report',
        report_id: reportId,
        elapsed_ms: elapsedMs,
        reason: 'component_unmount',
      })
    }
  }, [isAnalysing, reportId])

  // 화면 비활성화가 발생한 세션은 초단기 이탈에서 제외
  useEffect(() => {
    if (!isAnalysing || !reportId) return

    const handleVisibilityChange = () => {
      if (!document.hidden) return

      hiddenOccurredRef.current = true
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isAnalysing, reportId])

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
          {cardType === 'pendingCard' && (
            <PendingCard intvId={record.intvId} title={record.title} />
          )}
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
