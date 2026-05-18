import { useQuery } from '@tanstack/react-query'
import { getInterviewQuestionsAction } from '@/featured/interview/actions/interview.action'
import { useEffect } from 'react'
import { sendGAEvent } from '@next/third-parties/google'

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
    // 데이터가 비어있거나 생성 중일 때만 2초마다 폴링
    refetchInterval: (query) => {
      const questions = query.state.data
      // 삼항연산자: 리스폰스 데이터가 없으면(null) 2초마다 폴링, 리스폰스 데이터가 있으면 폴링 중단
      return !questions || (Array.isArray(questions) && questions.length === 0) ? 2000 : false
    },
    enabled: isEnabled && !!intvId, // 활성화
    staleTime: 0, // 신선도
    retry: 2, // 재시도
  })
  useEffect(() => {
    if (query.data && query.data.length > 0) {
      // 질문 생성 완료 (Complete)- GA 이벤트 전송
      sendGAEvent('event', 'question_gen_complete', { category: 'ai_interview' })

      handlePollingComplete()
    }
  }, [query.data, handlePollingComplete])
  return query
}
