'use client'

import { motion } from 'framer-motion'
import { Play, History, RotateCw } from 'lucide-react'
import { QuickStartCard } from '@/featured/dashboard/components/QuickStartCard'

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: 'easeOut' as const },
  }),
}

interface QuickStartSectionProps {
  restartIntvId?: number
}

export function QuickStartSection({ restartIntvId }: QuickStartSectionProps = {}) {
  // TODO: 실제 유저 상태(진행 중인 면접 여부)에 따라 이 값을 동적으로 설정해야 합니다.
  const hasInProgressInterview = !!restartIntvId

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
          <QuickStartCard
            title="이어하기"
            description={
              hasInProgressInterview
                ? '진행중인 면접이 있습니다. 이어서 진행해 보세요'
                : '현재 진행 중인 면접이 없습니다.'
            }
            icon={RotateCw}
            iconStyle="bg-linear-to-br from-green-100 to-emerald-100 text-green-600 group-hover:from-green-200 group-hover:to-emerald-200"
            iconColorStyle="text-green-600"
            href={restartIntvId ? `/interview?restart=true&id=${restartIntvId}` : '/interview'}
            buttonText="이어서 면접보기"
            isDisabled={!hasInProgressInterview}
            buttonTextStyle="text-green-600"
            hoverBorderStyle="hover:border-green-300 hover:shadow-green-600/5"
          />
        </motion.div>
      </div>
    </div>
  )
}
