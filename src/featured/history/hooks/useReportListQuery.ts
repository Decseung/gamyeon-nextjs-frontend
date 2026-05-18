'use client'

import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/featured/auth/store'
import { getReportListAction } from '@/featured/history/actions/history.action'

const POLLING_INTERVAL_MS = 30000

export function useReportListQuery() {
  const { isLoggedIn } = useAuthStore()

  return useQuery({
    queryKey: ['reportList'],
    queryFn: async () => {
      const response = await getReportListAction()
      if (!response.success) throw new Error('리포트 목록 조회 실패')
      return response.data ?? []
    },
    enabled: isLoggedIn,
    staleTime: 0,
    refetchInterval: (query) => {
      const hasInProgress = query.state.data?.some(
        (item) => item.report?.reportStatus === 'IN_PROGRESS',
      )
      return hasInProgress ? POLLING_INTERVAL_MS : false
    },
  })
}
