'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/shared/ui/card'
import { ChevronRight, Inbox, Loader2 } from 'lucide-react'
import { InterviewReportItem } from '@/featured/history/types'
import { formatDateDot } from '@/shared/lib/utils/date'
import { getScoreConfig } from '@/featured/report/constants'

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: 'easeOut' as const },
  }),
}

// 목데이터는 주석 처리
/*
const mockRecentHistory = [
  { id: 1, position: '프론트엔드 개발자', score: 76, date: '2026.02.25' },
  { id: 2, position: '프론트엔드 개발자', score: 68, date: '2026.02.22' },
 { id: 3, position: '백엔드 개발자', score: 65, date: '2026.02.18' },
]
*/

export interface RecentHistorySectionProps {
  records?: InterviewReportItem[]
}

export function RecentHistorySection({ records = [] }: RecentHistorySectionProps) {
  const displayRecords = [...records]
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
            displayRecords.map((item) => {
              const score = item.report?.totalScore
              const reportStatus = item.report?.reportStatus
              const isAnalyzing = reportStatus === 'IN_PROGRESS'
              const hasScore = score !== null && score !== undefined

              return (
                <Link
                  key={item.intvId}
                  href={`/report/${item.intvId}`}
                  className="flex h-18.25 flex-col justify-center"
                >
                  <div className="hover:bg-muted/40 flex h-full w-full items-center gap-4 px-5 transition-colors">
                    <div
                      className={`flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl text-sm font-bold ${
                        hasScore ? getScoreConfig(score).style : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {isAnalyzing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : hasScore ? (
                        score
                      ) : (
                        '-'
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{item.intvTitle}</p>
                      {isAnalyzing ? (
                        <p className="text-xs text-amber-500">AI 리포트 분석 중...</p>
                      ) : (
                        <p className="text-muted-foreground text-xs">
                          {formatDateDot(new Date(item.updatedAt))}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="text-muted-foreground h-4 w-4" />
                  </div>
                </Link>
              )
            })
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
