'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/shared/ui/card'
import { ChevronRight, Inbox } from 'lucide-react'
import { InterviewReportItem } from '@/featured/history/types'
import { RecentHistoryRow } from './RecentHistoryRow'

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: 'easeOut' as const },
  }),
}

export interface RecentHistorySectionProps {
  records?: InterviewReportItem[]
}

export function RecentHistorySection({ records = [] }: RecentHistorySectionProps) {
  const displayRecords = [...records]
    .filter((r) => r.intvStatus === 'FINISHED' || r.intvStatus === 'PAUSED')
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 3)
  const isEmpty = displayRecords.length === 0

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeUp}
      custom={4}
      className="flex h-full flex-col"
    >
      <div className="mb-3 flex shrink-0 items-center justify-between">
        <h2 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          최근 면접 기록
        </h2>
        {!isEmpty && (
          <Link
            href="/history"
            className="text-primary flex items-center gap-1 text-xs hover:underline"
          >
            전체 보기 <ChevronRight className="h-3 w-3" />
          </Link>
        )}
      </div>

      <Card className="border-border/50 flex h-67 flex-col overflow-hidden">
        <CardContent
          className={
            isEmpty
              ? 'flex flex-1 flex-col items-center justify-center p-5'
              : 'flex flex-1 flex-col p-0 py-6'
          }
        >
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="bg-muted/30 flex h-12 w-12 items-center justify-center rounded-full">
                <Inbox className="text-muted-foreground h-6 w-6" />
              </div>
              <p className="text-muted-foreground text-sm">진행된 면접 기록이 없습니다.</p>
            </div>
          ) : (
            displayRecords.map((item) => <RecentHistoryRow key={item.intvId} item={item} />)
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
