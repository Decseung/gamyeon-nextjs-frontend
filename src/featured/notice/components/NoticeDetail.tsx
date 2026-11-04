'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, Calendar, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import type { Notice, NoticeDetailResponse } from '@/featured/notice/types'
import { NOTICE_CATEGORY } from '@/featured/notice/constants'
import { formatDateDot, checkIsRecent } from '@/shared/lib/utils/date'
import Image from 'next/image'
import { PageContainer } from '@/shared/components/PageContainer'

interface NoticeDetailProps {
  notice: NoticeDetailResponse
  prevNotice: Notice | null
  nextNotice: Notice | null
}

function NoticeContent({ content }: { content: string }) {
  const paragraphs = content.split('\n\n')

  return (
    <div className="space-y-3 text-sm leading-7">
      {paragraphs.map((paragraph, i) => {
        if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
          return (
            <p key={i} className="text-foreground pt-1 font-semibold">
              {paragraph.slice(2, -2)}
            </p>
          )
        }
        if (paragraph.startsWith('- ')) {
          const items = paragraph.split('\n').filter((line) => line.startsWith('- '))
          return (
            <ul key={i} className="text-foreground/75 ml-1 list-none space-y-1.5">
              {items.map((item, j) => (
                <li key={j} className="flex items-start gap-2">
                  <span className="bg-primary/60 mt-2.5 h-1 w-1 shrink-0 rounded-full" />
                  {item.slice(2)}
                </li>
              ))}
            </ul>
          )
        }
        if (paragraph.match(/^\d+\./)) {
          const items = paragraph.split('\n').filter((line) => line.match(/^\d+\./))
          return (
            <ol key={i} className="text-foreground/75 ml-1 list-none space-y-1.5">
              {items.map((item, j) => (
                <li key={j} className="flex items-start gap-2.5">
                  <span className="bg-primary/10 text-primary mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold">
                    {j + 1}
                  </span>
                  {item.replace(/^\d+\.\s*/, '')}
                </li>
              ))}
            </ol>
          )
        }
        return (
          <p key={i} className="text-foreground/75 whitespace-pre-line">
            {paragraph}
          </p>
        )
      })}
    </div>
  )
}

export function NoticeDetail({ notice, prevNotice, nextNotice }: NoticeDetailProps) {
  const shouldReduceMotion = useReducedMotion()
  const config = NOTICE_CATEGORY[notice.category] || NOTICE_CATEGORY.NOTICE
  const isRecent = checkIsRecent(notice.createdAt)

  return (
    <PageContainer className="py-6">
      <motion.div
        initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={
          shouldReduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 300, damping: 28 }
        }
      >
        {/* 상단: 목록으로 + 브레드크럼 */}
        <div className="mb-6 flex items-center justify-between">
          <Button variant="ghost" size="sm" className="text-muted-foreground -ml-2 gap-1.5" asChild>
            <Link href="/notices">
              <ArrowLeft className="h-3.5 w-3.5" />
              목록으로
            </Link>
          </Button>
          <nav className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <Link href="/dashboard" className="hover:text-foreground transition-colors">
              대시보드
            </Link>
            <ChevronRight className="h-3 w-3" />
            <Link href="/notices" className="hover:text-foreground transition-colors">
              공지사항
            </Link>
          </nav>
        </div>

        {/* 본문 카드 */}
        <Card className="border-border/50 mb-5 overflow-hidden py-4">
          {/* 카드 헤더 */}
          <div className="border-border/50 border-b px-8 py-6">
            <div className="mb-3 flex items-center gap-2">
              <span
                className={`flex h-5 w-14 shrink-0 items-center justify-center rounded text-[10px] font-medium ${config.color}`}
              >
                {config.label}
              </span>
              {isRecent ? (
                <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white">
                  N
                </span>
              ) : null}
            </div>

            <h1 className="mb-4 text-lg leading-snug font-bold">{notice.title}</h1>

            <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
              <Calendar className="h-3 w-3" />
              <span>{formatDateDot(new Date(notice.createdAt))}</span>
            </div>
          </div>

          {/* 본문 내용 + 첨부 이미지 */}
          <CardContent className="px-8 py-7">
            {/* 글씨 본문 */}
            <NoticeContent content={notice.content} />

            {notice.imageUrls && notice.imageUrls.length > 0 && (
              <div className="mt-8 flex flex-col gap-4">
                {notice.imageUrls.map((url, index) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <Image
                    key={index}
                    src={url}
                    alt={`공지사항 첨부 이미지 ${index + 1}`}
                    className="w-full max-w-2xl rounded-lg border"
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/*  이전글/다음글(prevNotice, nextNotice) 추가? */}
      </motion.div>
    </PageContainer>
  )
}
