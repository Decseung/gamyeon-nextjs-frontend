'use client'

import { HeaderActions } from '@/shared/components/header-actions'
import { SETTINGS_COPY } from '../constants'

export function SettingsHeader() {
  return (
    <div className="border-border/50 bg-background/80 flex items-center justify-between border-b px-8 py-5 backdrop-blur">
      <div>
        <h1 className="text-xl font-bold">{SETTINGS_COPY.pageTitle}</h1>
        <p className="text-muted-foreground mt-0.5 text-sm">{SETTINGS_COPY.pageDescription}</p>
      </div>
      <HeaderActions />
    </div>
  )
}
