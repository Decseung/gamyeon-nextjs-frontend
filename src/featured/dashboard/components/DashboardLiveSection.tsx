'use client'

import { useReportListQuery } from '@/featured/history/hooks/useReportListQuery'
import { InterviewReportItem } from '@/featured/history/types'
import { StatusSection } from './StatusSection'
import { RecentHistorySection } from './RecentHistorySection'
import { NoticeSection } from './NoticeSection'

interface DashboardLiveSectionProps {
  initialRecords: InterviewReportItem[]
}

export function DashboardLiveSection({ initialRecords }: DashboardLiveSectionProps) {
  const { data: records = initialRecords } = useReportListQuery()

  return (
    <>
      <StatusSection records={records} />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <RecentHistorySection records={records} />
        <NoticeSection />
      </div>
    </>
  )
}
