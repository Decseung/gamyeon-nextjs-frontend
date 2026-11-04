'use client'

import { HeaderActions } from '@/shared/components/header-actions'
import { PageContainer } from '@/shared/components/PageContainer'
import { SETTINGS_COPY } from '../constants'

export function SettingsHeader() {
  return (
    <div className="border-border/50 bg-background/80 border-b backdrop-blur">
      <PageContainer className="flex items-center justify-between py-5">
        <div>
          <h1 className="text-xl font-bold">{SETTINGS_COPY.pageTitle}</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">{SETTINGS_COPY.pageDescription}</p>
        </div>
        <HeaderActions />
      </PageContainer>
    </div>
  )
}
