'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Play, History, RotateCw, ArrowRight } from 'lucide-react'
import { QuickStartCard } from '@/featured/dashboard/components/QuickStartCard'
import { ResumeInterviewModal } from '@/featured/dashboard/components/ResumeInterviewModal'
import { InterviewStartGuideModal } from '@/featured/dashboard/components/InterviewStartGuideModal'
import { Card, CardContent } from '@/shared/ui/card'
import { InterviewReportItem } from '@/featured/history/types'

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: 'easeOut' as const },
  }),
}

interface QuickStartSectionProps {
  records: InterviewReportItem[]
}

export function QuickStartSection({ records }: QuickStartSectionProps) {
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false)
  const [isStartGuideModalOpen, setIsStartGuideModalOpen] = useState(false)

  const pausedInterviewCount = records.filter((record) => record.intvStatus === 'PAUSED').length
  const hasPausedInterview = pausedInterviewCount > 0

  const handleStartClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (!hasPausedInterview) return
    event.preventDefault()
    setIsStartGuideModalOpen(true)
  }

  return (
    <div>
      <h2 className="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
        빠른 시작
      </h2>
      <div className="flex min-h-40 flex-row gap-4">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={1}
          className="flex-1"
        >
          <QuickStartCard
            title="면접 시작"
            description="AI 면접관과 실전 모의 면접을 진행하세요"
            icon={Play}
            iconStyle="bg-primary/10 text-primary group-hover:bg-primary/20"
            iconColorStyle="text-primary"
            href="/interview"
            buttonText="지금 시작"
            isRecommended={true}
            onClick={handleStartClick}
          />
        </motion.div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={2}
          className="flex-1"
        >
          <QuickStartCard
            title="면접 기록"
            description="지난 면접 결과와 피드백을 다시 확인하세요"
            icon={History}
            iconStyle="bg-violet-50 text-violet-600 group-hover:bg-violet-100"
            iconColorStyle="text-violet-600"
            href="/history"
            buttonText="기록 보기"
            buttonTextStyle="text-violet-600"
            hoverBorderStyle="hover:border-violet-300 hover:shadow-violet-600/5"
          />
        </motion.div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={3}
          className="flex-1"
        >
          <div
            className={`h-full w-full ${hasPausedInterview ? 'cursor-pointer' : 'cursor-not-allowed'}`}
            aria-disabled={!hasPausedInterview}
            onClick={() => hasPausedInterview && setIsResumeModalOpen(true)}
          >
            <Card
              className={`group flex h-full flex-col transition-all ${
                hasPausedInterview
                  ? 'border-border/50 hover:border-green-300 hover:shadow-md hover:shadow-green-600/5'
                  : 'border-border/50 bg-slate-50'
              }`}
            >
              <CardContent className="flex flex-1 flex-col p-5">
                <div
                  className={`mb-4 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors ${
                    hasPausedInterview
                      ? 'bg-linear-to-br from-green-100 to-emerald-100 group-hover:from-green-200 group-hover:to-emerald-200'
                      : 'bg-slate-200/50'
                  }`}
                >
                  <RotateCw
                    className={`h-5 w-5 ${hasPausedInterview ? 'text-green-600' : 'text-slate-400'}`}
                  />
                </div>
                <h3 className={`mb-1 font-semibold ${hasPausedInterview ? '' : 'text-slate-400'}`}>
                  이어하기
                </h3>
                <p
                  className={`flex-1 text-xs leading-relaxed ${
                    hasPausedInterview ? 'text-muted-foreground' : 'text-slate-400 opacity-60'
                  }`}
                >
                  {hasPausedInterview
                    ? `진행중인 면접이 ${pausedInterviewCount}개 있습니다. 이어서 진행해 보세요`
                    : '진행중인 면접이 없습니다'}
                </p>
                <div
                  className={`mt-4 flex shrink-0 items-center gap-1 text-xs font-medium ${
                    hasPausedInterview ? 'text-green-600' : 'text-slate-400'
                  }`}
                >
                  이어서 면접보기 <ArrowRight className="h-3 w-3" />
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>

      <ResumeInterviewModal open={isResumeModalOpen} onClose={() => setIsResumeModalOpen(false)} />
      <InterviewStartGuideModal
        open={isStartGuideModalOpen}
        onClose={() => setIsStartGuideModalOpen(false)}
        onResume={() => setIsResumeModalOpen(true)}
      />
    </div>
  )
}
