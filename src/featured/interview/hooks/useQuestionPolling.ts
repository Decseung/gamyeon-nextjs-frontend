import { useQuery } from '@tanstack/react-query'
import { getInterviewQuestionsAction } from '@/featured/interview/actions/interview.action'
import { useEffect } from 'react'
import { trackEvent } from '@/shared/lib/utils/analytics'
import type { ApiResponse } from '@/shared/lib/api'
import type { GetInterviewQuestionsResponse } from '@/featured/interview/types'

export function useQuestionPolling(
  intvId: number | null,
  isEnabled: boolean,
  handlePollingComplete: () => void,
) {
  const query = useQuery({
    queryKey: ['interview-question', intvId],
    queryFn: async () => {
      if (intvId === null) throw new Error('인터뷰 ID 가 없습니다.')
      return await getInterviewQuestionsAction(intvId)
    },
    select: (response) => {
      if (!response.success) {
        throw new Error(response.message || '면접 질문 조회 실패')
      }
      return response.data?.questions || []
    },
    // query.state.data는 select 이전 원본 응답 객체이므로 questions 필드를 직접 참조
    refetchInterval: (query) => {
      const raw = query.state.data as ApiResponse<GetInterviewQuestionsResponse> | undefined
      const questions = raw?.data?.questions
      return !questions || questions.length === 0 ? 2000 : false
    },
    refetchIntervalInBackground: true,
    enabled: isEnabled && !!intvId,
    staleTime: 0,
    retry: 2,
  })

  useEffect(() => {
    if (query.data && query.data.length > 0) {
      // 질문 생성 완료 (Complete)- GA 이벤트 전송 (trackEvent 적용)
      trackEvent('question_gen_complete', { category: 'user_interview' })

      handlePollingComplete()
    }
  }, [query.data, handlePollingComplete])

  return query
}
