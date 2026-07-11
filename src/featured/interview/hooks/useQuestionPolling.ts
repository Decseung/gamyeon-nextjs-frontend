import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getInterviewQuestionsAction } from '@/featured/interview/actions/interview.action'
import { useCallback, useEffect, useState } from 'react'
import { trackEvent } from '@/shared/lib/utils/analytics'
import {
  QUESTION_POLLING_INTERVAL_MS,
  QUESTION_POLLING_MAX_RETRIES,
  QUESTION_POLLING_TIMEOUT_MS,
} from '@/featured/interview/constants'

const HTTP_SERVER_ERROR_MIN = 500

/** 질문 조회 실패 — 백엔드 code와 HTTP status를 보존해 재시도 가능 여부 판별에 사용 */
class QuestionPollingError extends Error {
  readonly code: string
  readonly httpStatus?: number

  constructor(message: string, code: string, httpStatus?: number) {
    super(message)
    this.name = 'QuestionPollingError'
    this.code = code
    this.httpStatus = httpStatus
  }
}

/**
 * 재시도 가능(일시적) 에러 판별:
 * - NETWORK_ERROR(네트워크 단절, 비정상 응답 body) → 재시도
 * - HTTP 5xx → 재시도
 * - 서버 액션 전송 자체가 실패한 알 수 없는 에러 → 네트워크 문제로 간주, 재시도
 * - 그 외(4xx 등 결정적 에러) → 즉시 실패
 */
function isRetryablePollingError(error: unknown): boolean {
  if (!(error instanceof QuestionPollingError)) return true
  if (error.code === 'NETWORK_ERROR') return true
  return error.httpStatus !== undefined && error.httpStatus >= HTTP_SERVER_ERROR_MIN
}

export function useQuestionPolling(
  intvId: number | null,
  isEnabled: boolean,
  handlePollingComplete: () => void,
) {
  const queryClient = useQueryClient()
  const [isTimedOut, setIsTimedOut] = useState(false)
  const [pollingEpoch, setPollingEpoch] = useState(0)

  const query = useQuery({
    queryKey: ['interview-question', intvId],
    queryFn: async () => {
      if (intvId === null) throw new Error('인터뷰 ID 가 없습니다.')
      const response = await getInterviewQuestionsAction(intvId)
      if (!response.success) {
        throw new QuestionPollingError(
          response.message || '면접 질문 조회 실패',
          response.code,
          response.httpStatus,
        )
      }
      return response.data?.questions ?? []
    },
    refetchInterval: (query) => {
      // 재시도 소진 후 에러 상태 — 폴링 중단 (실패 UI에서 수동 재시도)
      if (query.state.status === 'error') return false
      const questions = query.state.data
      return !questions || questions.length === 0 ? QUESTION_POLLING_INTERVAL_MS : false
    },
    refetchIntervalInBackground: true,
    enabled: isEnabled && !!intvId && !isTimedOut,
    staleTime: 0,
    retry: (failureCount, error) =>
      isRetryablePollingError(error) && failureCount < QUESTION_POLLING_MAX_RETRIES,
  })

  const hasQuestions = !!query.data && query.data.length > 0
  const isFailed = query.isError || isTimedOut
  const isRetryableFailure = isTimedOut || (query.isError && isRetryablePollingError(query.error))

  // 질문 생성 전체 타임아웃 — 요청은 성공하지만 질문이 계속 오지 않는 경우
  // pollingEpoch: '다시 시도' 시 타이머를 재시작하기 위한 의존성
  useEffect(() => {
    if (!isEnabled || hasQuestions || query.isError) return
    const timer = setTimeout(() => setIsTimedOut(true), QUESTION_POLLING_TIMEOUT_MS)
    return () => clearTimeout(timer)
  }, [isEnabled, hasQuestions, query.isError, pollingEpoch])

  const restartPolling = useCallback(() => {
    setIsTimedOut(false)
    setPollingEpoch((prev) => prev + 1)
    void queryClient.resetQueries({ queryKey: ['interview-question', intvId] })
  }, [queryClient, intvId])

  useEffect(() => {
    if (hasQuestions) {
      // 질문 생성 완료 (Complete)- GA 이벤트 전송 (trackEvent 적용)
      trackEvent('question_gen_complete', { category: 'user_interview' })

      handlePollingComplete()
    }
  }, [hasQuestions, handlePollingComplete])

  useEffect(() => {
    if (!isFailed) return
    // 질문 생성 실패 - GA 이벤트 전송
    trackEvent('question_gen_failed', { category: 'user_interview' })
  }, [isFailed])

  return {
    questions: query.data,
    isFailed,
    isRetryableFailure,
    restartPolling,
  }
}
