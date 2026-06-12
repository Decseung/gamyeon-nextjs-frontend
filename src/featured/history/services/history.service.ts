import { ApiResponse, PaginatedResponse, serverApi } from '@/shared/lib/api'
import { InterviewReportItem } from '../types'

export async function getIntvList(): Promise<ApiResponse<InterviewReportItem[]>> {
  const config = { silent: true, params: { size: 200 } }
  const response = await serverApi.get<PaginatedResponse<InterviewReportItem>>(
    '/api/v1/intvs',
    config,
  )
  return {
    ...response,
    data: response.data?.content ?? null,
  }
}
