'use client'

import { useIntvListQuery } from '@/featured/history/hooks/useIntvListQuery'
import type { InterviewReportItem } from '@/featured/history/types'
import type { Notice } from '@/featured/notice/types'
import { StatusSection } from './StatusSection'
import { RecentHistorySection } from './RecentHistorySection'
import { NoticeSection } from './NoticeSection'

interface DashboardLiveSectionProps {
  initialRecords: InterviewReportItem[]
  initialNotices: Notice[]
}

export function DashboardLiveSection({
  initialRecords,
  initialNotices,
}: DashboardLiveSectionProps) {
  const { data: records = initialRecords } = useIntvListQuery()

  return (
    <>
      <StatusSection records={records} />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <RecentHistorySection records={records} />
        <NoticeSection initialNotices={initialNotices} />
      </div>
    </>
  )
}
