'use server'

import type { ApiResponse } from '@/shared/lib/api'
import { withAction } from '@/shared/lib/withAction'
import { InterviewReportItem } from '../types'
import { getIntvList } from '../services/history.service'

export async function getIntvListAction(): Promise<ApiResponse<InterviewReportItem[]>> {
  return withAction(() => getIntvList())
}