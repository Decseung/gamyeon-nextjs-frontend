import type { Metadata } from 'next'
import { SettingsHeader } from '@/featured/settings/components/SettingsHeader'
import { AccountCard } from '@/featured/settings/components/AccountCard'
import { GeneralCard } from '@/featured/settings/components/GeneralCard'
import { PageContainer } from '@/shared/components/PageContainer'

export const metadata: Metadata = {
  title: '설정',
}

export default function SettingsPage() {
  return (
    <>
      <SettingsHeader />
      <PageContainer className="py-6 xl:py-8">
        <div className="mx-auto grid w-full max-w-2xl grid-cols-1 items-start gap-6">
          <AccountCard />
          <GeneralCard />
        </div>
      </PageContainer>
    </>
  )
}
