// src/app/dashboard/page.tsx
import { DashboardHeader } from '@/featured/dashboard/components/DashboardHeader'
import { QuickStartSection } from '@/featured/dashboard/components/QuickStartSection'
import { DashboardLiveSection } from '@/featured/dashboard/components/DashboardLiveSection'
import { getIntvListAction } from '@/featured/history/actions/history.action'
import { getNoticesAction } from '@/featured/notice/actions/notice.action'
import { PageContainer } from '@/shared/components/PageContainer'

export default async function DashboardPage() {
  const [historyResponse, noticeResponse] = await Promise.all([
    getIntvListAction(),
    getNoticesAction(),
  ])
  const initialRecords = historyResponse.success && historyResponse.data ? historyResponse.data : []
  const initialNotices =
    noticeResponse.success && noticeResponse.data ? noticeResponse.data.slice(0, 4) : []

  return (
    <>
      <DashboardHeader />
      <PageContainer className="space-y-6 py-4">
        <QuickStartSection records={initialRecords} />
        <DashboardLiveSection initialRecords={initialRecords} initialNotices={initialNotices} />
      </PageContainer>
    </>
  )
}
