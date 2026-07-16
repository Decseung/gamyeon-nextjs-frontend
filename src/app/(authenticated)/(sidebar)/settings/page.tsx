import type { Metadata } from 'next'
import { SettingsHeader } from '@/featured/settings/components/SettingsHeader'
import { AccountCard } from '@/featured/settings/components/AccountCard'
import { GeneralCard } from '@/featured/settings/components/GeneralCard'

export const metadata: Metadata = {
  title: '설정',
}

export default function SettingsPage() {
  return (
    <>
      <SettingsHeader />
      <div className="mx-auto grid w-full max-w-2xl grid-cols-1 items-start gap-6 p-6 sm:p-8 lg:grid-cols-1">
        <GeneralCard />
        <AccountCard />
      </div>
    </>
  )
}
