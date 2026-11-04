'use client'

import { motion } from 'framer-motion'
import { useAuthStore } from '@/featured/auth/store'
import { HeaderActions } from '@/shared/components/header-actions'
import { PageContainer } from '@/shared/components/PageContainer'

export function DashboardHeader() {
  const { user } = useAuthStore()

  return (
    <div className="border-border/50 bg-background/80 border-b backdrop-blur">
      <PageContainer className="flex items-center justify-between py-5">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-xl font-bold">안녕하세요, {user?.nickname ?? '사용자'}님 👋</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">오늘도 면접 실력을 키워볼까요?</p>
        </motion.div>
        <HeaderActions />
      </PageContainer>
    </div>
  )
}
