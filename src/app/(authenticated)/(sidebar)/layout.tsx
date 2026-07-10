import { isRedirectError } from 'next/dist/client/components/redirect-error'
import { DashboardSidebar } from '@/shared/components/dashboard-sidebar'
import { getIntvList } from '@/featured/history/services/history.service'
import type { InterviewReportItem } from '@/featured/history/types'

export default async function WithSidebarLayout({ children }: { children: React.ReactNode }) {
  let pausedRecords: InterviewReportItem[] = []
  try {
    const response = await getIntvList()
    pausedRecords = response.data?.filter((r) => r.intvStatus === 'PAUSED') ?? []
  } catch (error) {
    if (isRedirectError(error)) throw error
    console.error('사이드바 면접 목록 불러오기 실패:', error)
  }

  return (
    <div className="bg-muted/20 flex h-screen overflow-hidden">
      <DashboardSidebar pausedRecords={pausedRecords} />
      <main className="flex flex-1 flex-col overflow-y-auto">{children}</main>
    </div>
  )
}
