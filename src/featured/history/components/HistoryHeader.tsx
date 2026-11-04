'use client'

import { HeaderActions } from '@/shared/components/header-actions'
import { PageContainer } from '@/shared/components/PageContainer'

export function HistoryHeader() {
  return (
    <div className="border-border/50 bg-background/80 border-b backdrop-blur">
      <PageContainer className="flex items-center justify-between py-5">
        <div>
          <h1 className="text-xl font-bold">면접 기록</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            지금까지의 면접 연습 기록과 점수 변화를 확인하세요.
          </p>
        </div>
        <HeaderActions />
      </PageContainer>
    </div>
  )
}
