'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { FileText, Inbox } from 'lucide-react'
import { InterviewReportItem } from '@/featured/history/types'
import { getReportCardType } from '@/featured/history/constants'
import { FlipCard } from '@/featured/history/components/cards/FlipCard'
import { usePageVisibilityTracker } from '../hooks/usePageVisibilityTracker'

interface HistoryContainerProps {
  records: InterviewReportItem[]
  search: string
  currentPage: number
  itemsPerPage: number
}

export function HistoryContainer({
  records,
  search,
  currentPage,
  itemsPerPage,
}: HistoryContainerProps) {
  const start = (currentPage - 1) * itemsPerPage
  const pageRecords = useMemo(() => {
    return records.slice(start, start + itemsPerPage)
  }, [itemsPerPage, records, start])

  const analysingReportIds = useMemo(() => {
    return pageRecords
      .filter((record) => {
        return getReportCardType(record.intvStatus, record.report?.reportStatus) === 'analysingCard'
      })
      .map((record) => record.report?.reportId)
      .filter((reportId): reportId is number => reportId != null)
  }, [pageRecords])

  usePageVisibilityTracker(analysingReportIds.length > 0, analysingReportIds)

  if (records.length === 0) {
    if (search) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex min-h-[calc(100vh-250px)] flex-col items-center justify-center text-center"
        >
          <div className="bg-muted mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl">
            <FileText className="text-muted-foreground h-7 w-7" />
          </div>
          <h3 className="mb-1 text-lg font-semibold">기록이 없습니다</h3>
          <p className="text-muted-foreground mb-6 text-sm">
            검색 결과가 없습니다. 다른 키워드로 검색해보세요.
          </p>
        </motion.div>
      )
    }

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex min-h-[calc(100vh-250px)] flex-col items-center justify-center text-center"
      >
        <Link
          href="/interview"
          className="group flex cursor-pointer flex-col items-center justify-center"
        >
          <div className="bg-primary/10 text-primary mb-6 rounded-full p-4 transition-transform duration-300 group-hover:scale-110">
            <Inbox className="h-8 w-8" />
          </div>

          <div className="mb-8 flex flex-col items-center gap-1.5">
            <h3 className="text-foreground text-xl font-bold">진행된 면접 기록이 없습니다.</h3>
            <p className="text-muted-foreground text-sm">
              아직 면접 연습 기록이 없습니다. 첫 면접을 시작해보세요!
            </p>
          </div>

          <span className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center rounded-md px-8 py-3 text-base font-semibold shadow-sm transition-colors">
            첫 면접 시작하기 &rarr;
          </span>
        </Link>
      </motion.div>
    )
  }

  return (
    <div className="@container">
      <div className="grid grid-cols-1 gap-4 @[416px]:grid-cols-2 @[640px]:grid-cols-3 @[640px]:gap-5 @[860px]:grid-cols-4 @[1080px]:grid-cols-5">
        {pageRecords.map((record, i) => (
          <motion.div
            key={record.intvId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.4 }}
            className="min-w-0"
          >
            <FlipCard record={record} />
          </motion.div>
        ))}
      </div>
    </div>
  )
}
