'use client'

import { HeaderActions } from '@/shared/components/header-actions'

export function HistoryHeader() {
  return (
    <div className="border-border/50 bg-background/80 flex items-center justify-between border-b px-4 py-5 backdrop-blur sm:px-6 xl:px-8">
      <div>
        <h1 className="text-xl font-bold">면접 기록</h1>
        <p className="text-muted-foreground mt-0.5 text-sm">
          지금까지의 면접 연습 기록과 점수 변화를 확인하세요.
        </p>
      </div>
      <HeaderActions />
    </div>
  )
}
