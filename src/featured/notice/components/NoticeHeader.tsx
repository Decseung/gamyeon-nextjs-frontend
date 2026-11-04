'use client'

import { HeaderActions } from '@/shared/components/header-actions'
import { PageContainer } from '@/shared/components/PageContainer'

export function NoticeHeader() {
  return (
    <div className="border-border/50 bg-background/80 border-b backdrop-blur">
      <PageContainer className="flex items-center justify-between py-5">
        <div>
          <h1 className="text-xl font-bold">공지사항</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            가상 면접 AI 서비스의 새로운 소식과 유용한 정보를 확인해 보세요.
          </p>
        </div>
        <HeaderActions />
      </PageContainer>
    </div>
  )
}
