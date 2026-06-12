import { DashboardSidebar } from '@/shared/components/dashboard-sidebar'
import { getIntvList } from '@/featured/history/services/history.service'

export default async function WithSidebarLayout({ children }: { children: React.ReactNode }) {
  const response = await getIntvList()
  const pausedRecords = response.data?.filter((r) => r.intvStatus === 'PAUSED') ?? []

  return (
    <div className="bg-muted/20 flex h-screen overflow-hidden">
      <DashboardSidebar pausedRecords={pausedRecords} />
      <main className="flex flex-1 flex-col overflow-y-auto">{children}</main>
    </div>
  )
}
