'use client'

import { useState } from 'react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import {
  ChevronDown,
  MessageCircleCheck,
  Lightbulb,
  VideoOff,
  AlertCircle,
  Clock,
} from 'lucide-react'
import { Card } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import type { QuestionSummary } from '@/featured/report/types'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: 'easeOut' as const },
  }),
}

const videoVariants: Variants = {
  hidden: { opacity: 0, height: 0, marginTop: 0 },
  visible: {
    opacity: 1,
    height: 'auto',
    marginTop: 16,
    transition: {
      height: { duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] },
      marginTop: { duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] },
      opacity: { duration: 0.25, delay: 0.1 },
    },
  },
  exit: {
    opacity: 0,
    height: 0,
    marginTop: 0,
    transition: {
      height: { duration: 0.3, ease: 'easeInOut' },
      marginTop: { duration: 0.3, ease: 'easeInOut' },
      opacity: { duration: 0.2 },
    },
  },
}

//  VideoPlayer 컴포넌트 (상태 격리 및 예외 처리용)
function VideoPlayer({ url }: { url?: string | null }) {
  const [hasError, setHasError] = useState(false)

  // 1. 영상 주소가 아예 없는 경우 (보관 기간 만료)
  if (!url) {
    return (
      <div className="bg-secondary/30 text-muted-foreground flex h-full w-full flex-col items-center justify-center gap-2">
        <VideoOff className="h-8 w-8 opacity-50" />
        <p className="text-[14px] font-medium">보관 기간이 만료되어 영상을 조회할 수 없습니다.</p>
      </div>
    )
  }

  // 2. 영상 로드 중 에러가 발생한 경우 (네트워크 오류 등)
  if (hasError) {
    return (
      <div className="bg-secondary/30 text-destructive/80 flex h-full w-full flex-col items-center justify-center gap-2">
        <AlertCircle className="h-8 w-8 opacity-50" />
        <p className="text-[14px] font-medium">영상을 불러오는 중 오류가 발생했습니다.</p>
      </div>
    )
  }

  // 3. 정상적인 비디오 렌더링
  return (
    <video
      src={url}
      controls
      preload="metadata"
      className="h-full w-full object-cover"
      onClick={(e) => e.stopPropagation()} // 비디오 클릭 시 아코디언이 닫히는 이벤트 버블링 방지
      onError={() => setHasError(true)} // 에러 발생 시 상태 업데이트
    />
  )
}

interface QuestionFeedbackSectionProps {
  feedbacks: QuestionSummary[]
}

export function QuestionFeedbackSection({ feedbacks }: QuestionFeedbackSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggle = (i: number) => setOpenIndex((prev) => (prev === i ? null : i))

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={fadeUp}
      custom={0}
      className="mt-10"
    >
      <h2 className="text-foreground mb-5 text-xl font-bold tracking-tight">질문별 피드백</h2>
      <div className="space-y-4">
        {feedbacks.map((fb, i) => {
          const isOpen = openIndex === i

          return (
            <motion.div
              key={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={i}
            >
              <Card
                className="border-border/60 hover:bg-accent/5 flex cursor-pointer flex-row items-start gap-5 overflow-hidden px-6 py-7 shadow-sm transition-all"
                onClick={() => toggle(i)}
              >
                <div className="flex min-w-0 flex-1 flex-col gap-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="border-none bg-[oklch(0.55_0.15_180)] px-3 py-0.5 text-xs font-semibold text-white hover:opacity-90">
                      질문 {i + 1}
                    </Badge>
                    {fb.feedbackBadges.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="border-none bg-[oklch(0.55_0.15_180/0.1)] px-2.5 py-0.5 font-medium text-[oklch(0.45_0.12_180)]"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <h3 className="text-foreground/90 text-[17px] leading-snug font-bold tracking-tight">
                    {fb.question}
                  </h3>

                  <div className="space-y-4 pt-1">
                    <div className="flex items-start gap-3.5">
                      <div className="mt-0.5 rounded-full bg-blue-50 p-1.5">
                        <MessageCircleCheck className="h-4 w-4 text-blue-600" />
                      </div>
                      <p className="text-muted-foreground flex-1 pt-1 text-[14.5px] leading-relaxed">
                        {fb.answerSummary}
                      </p>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 shrink-0 rounded-full bg-amber-50 p-1.5">
                        <Lightbulb className="h-4 w-4 text-amber-600" />
                      </div>
                      <p className="text-foreground/80 pt-1 text-[15px] leading-relaxed font-medium">
                        {fb.feedback.strength} {fb.feedback.improvement}
                      </p>
                    </div>
                  </div>

                  {/* 비디오 영역 (mediaUrl 여부와 상관없이 아코디언이 열리면 노출) */}
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key="video"
                        variants={videoVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="overflow-hidden"
                      >
                        <div className="border-border/40 mx-auto w-full max-w-2xl overflow-hidden rounded-xl border bg-black/5 shadow-inner">
                          <div className="aspect-video">
                            <VideoPlayer url={fb.mediaUrl} />
                          </div>
                        </div>
                        {fb.mediaUrl && (
                          <p className="text-muted-foreground/50 mt-2 flex items-center justify-center gap-1 text-[12px]">
                            <Clock className="h-3 w-3" />
                            면접 영상은 종료 후 7일간 보관됩니다.
                          </p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <motion.div
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  className="mt-12 shrink-0"
                >
                  <ChevronDown className="text-muted-foreground/50 h-5 w-5" />
                </motion.div>
              </Card>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}
