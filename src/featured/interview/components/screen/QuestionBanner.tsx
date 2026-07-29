'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'
import { TypingText } from '@/featured/interview/components/screen/TypingText'
import type { InterviewQuestions } from '@/featured/interview/types'

interface QuestionBannerProps {
  isActive: boolean
  currentQuestion: number
  questions: InterviewQuestions[]
  typingKey: number
  questionRevealed: boolean
  onTypingComplete: () => void
}

export function QuestionBanner({
  isActive,
  currentQuestion,
  questions,
  typingKey,
  questionRevealed,
  onTypingComplete,
}: QuestionBannerProps) {
  const currentQuestionText = questions[currentQuestion]?.content ?? ''

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          key={`banner-${currentQuestion}`}
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="absolute top-14.25 right-0 left-0 z-30 flex justify-center px-4 pt-3"
        >
          <div className="flex w-full max-w-2xl items-start gap-3 rounded-2xl border border-white/10 bg-slate-800/90 px-5 py-4 shadow-2xl backdrop-blur-md">
            <span className="bg-primary mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white">
              {questions[currentQuestion]?.questionOrder ?? currentQuestion + 1}
            </span>
            <p className="text-sm leading-relaxed font-medium text-white/95">
              {!questionRevealed ? (
                <TypingText
                  key={typingKey}
                  text={currentQuestionText}
                  speed={28}
                  onComplete={onTypingComplete}
                />
              ) : (
                currentQuestionText
              )}
            </p>
            {questionRevealed && (
              <motion.span
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-0.5 shrink-0"
              >
                <CheckCircle2 className="h-4 w-4 text-green-400" />
              </motion.span>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
