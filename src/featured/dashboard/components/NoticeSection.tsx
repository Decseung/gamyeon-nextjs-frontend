'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/shared/ui/card'
import { ChevronRight, Megaphone } from 'lucide-react'
import type { Notice } from '@/featured/notice/types'
import { NOTICE_CATEGORY } from '@/featured/notice/constants'
import { formatDateDot, checkIsRecent } from '@/shared/lib/utils/date'

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: 'easeOut' as const },
  }),
}

type NoticeWithUI = Notice & { isRecent: boolean }

interface NoticeSectionProps {
  initialNotices: Notice[]
}

export function NoticeSection({ initialNotices }: NoticeSectionProps) {
  const notices: NoticeWithUI[] = initialNotices.map((item) => ({
    ...item,
    isRecent: checkIsRecent(item.createdAt),
  }))
  const isEmpty = notices.length === 0

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeUp}
      custom={5}
      className="flex h-full flex-col"
    >
      <div className="mb-3 flex shrink-0 items-center justify-between">
        <h2 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          공지사항
        </h2>
        <Link
          href="/notices"
          className="text-primary flex items-center gap-1 text-xs hover:underline"
        >
          전체 보기 <ChevronRight className="h-3 w-3" />
        </Link>
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
                <Megaphone className="text-muted-foreground h-6 w-6" />
              </div>
              <p className="text-muted-foreground text-sm">새로운 공지사항이 없습니다.</p>
            </div>
          ) : (
            // 데이터가 있을 때 목록 렌더링
            notices.map((item) => {
              const config = NOTICE_CATEGORY[item.category] || NOTICE_CATEGORY.NOTICE

              return (
                <Link
                  key={item.id}
                  href={`/notices/${item.id}`}
                  className="flex flex-1 flex-col justify-center"
                >
                  <div className="hover:bg-muted/40 flex h-full w-full items-center justify-between gap-4 px-5 transition-colors">
                    <div className="flex min-w-0 flex-1 items-center gap-2.5">
                      <span
                        className={`flex h-5 w-14 shrink-0 items-center justify-center rounded text-[10px] font-medium ${config.color}`}
                      >
                        {config.label}
                      </span>

                      <div className="flex min-w-0 items-center gap-1.5">
                        <p className="truncate text-sm font-medium">{item.title}</p>

                        {item.isRecent && (
                          <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white">
                            N
                          </span>
                        )}
                      </div>
                    </div>

                    <span className="text-muted-foreground shrink-0 text-xs">
                      {formatDateDot(new Date(item.createdAt))}
                    </span>
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
