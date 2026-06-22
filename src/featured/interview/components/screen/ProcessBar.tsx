'use client'

import { Button } from '@/shared/ui/button'
import { ArrowLeft, Power } from 'lucide-react'
import type { Phase, InterviewQuestions } from '@/featured/interview/types'
import Image from 'next/image'

interface TopBarProps {
  interviewTitle: string
  currentQuestion: number
  phase: Phase
  isActive: boolean
  questions: InterviewQuestions[]
  onEndClick: () => void
  onBackClick: () => void
}

export function ProcessBar({
  interviewTitle,
  currentQuestion,
  phase,
  isActive,
  questions,
  onEndClick,
  onBackClick,
}: TopBarProps) {
  return (
    <header className="relative z-20 flex items-center justify-between border-b border-white/10 bg-slate-900/90 px-4 py-3 backdrop-blur">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          aria-label="면접 중단"
          className="h-8 w-8 text-white/60 hover:bg-white/10 hover:text-white"
          onClick={onBackClick}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white">
          <Image
            src="/images/Gamyeon_Logo.svg"
            alt="Gamyeon logo"
            width={1024}
            height={768}
            style={{ height: '24px', width: 'auto' }}
          />
        </div>
        <span className="text-sm font-semibold">{interviewTitle}</span>
      </div>

      <div className="flex items-center gap-1.5">
        {questions.map((_, i) => (
          <div
            key={i}
            className={`h-2 rounded-full transition-all duration-300 ${
              i < currentQuestion
                ? 'w-2 bg-green-500'
                : i === currentQuestion && isActive
                  ? 'bg-primary w-5'
                  : 'w-2 bg-white/20'
            }`}
          />
        ))}
        <span className="ml-2 text-xs text-white/50">
          {currentQuestion + 1} / {questions.length}
        </span>
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="cursor-pointer gap-1.5 text-red-400 hover:bg-red-500/10 hover:text-red-300"
        onClick={onEndClick}
      >
        <Power className="h-3.5 w-3.5" />
        면접 종료
      </Button>
    </header>
  )
}
