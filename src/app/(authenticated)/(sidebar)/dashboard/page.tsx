// src/app/dashboard/page.tsx
import { DashboardHeader } from '@/featured/dashboard/components/DashboardHeader'
import { QuickStartSection } from '@/featured/dashboard/components/QuickStartSection'
import { DashboardLiveSection } from '@/featured/dashboard/components/DashboardLiveSection'
import { getReportListAction } from '@/featured/history/actions/history.action'

export default async function DashboardPage() {
  const response = await getReportListAction()
  const initialRecords = response.success && response.data ? response.data : []

  return (
    <>
      <DashboardHeader />
      <div className="space-y-6 px-8 py-4">
        <QuickStartSection />
        <DashboardLiveSection initialRecords={initialRecords} />
      </div>
    </>
  )
}
