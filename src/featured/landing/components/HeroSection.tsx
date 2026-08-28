'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import { Mic, Play, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react'

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-28 pb-20 sm:pt-36 sm:pb-28">
      <div className="absolute inset-0 -z-10">
        <div className="bg-primary/5 absolute top-1/4 left-1/2 h-125 w-125 -translate-x-1/2 rounded-full blur-3xl" />
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge variant="secondary" className="mb-6 gap-1.5 px-3 py-1.5 text-xs font-medium">
              <Sparkles className="h-3.5 w-3.5" />
              AI 기반 면접 시뮬레이터
            </Badge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
          >
            <span className="block">면접, 이제</span>
            <span className="mt-3 block">
              <span className="text-primary">AI와 함께</span> 준비하세요
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-muted-foreground mt-6 text-lg sm:text-xl"
          >
            실전과 동일한 환경에서 AI 면접관과 연습하고,
            <br className="hidden sm:block" />
            즉각적인 피드백으로 면접 실력을 향상시키세요.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
          >
            <Button size="lg" className="w-full gap-2 sm:w-auto" asChild>
              <Link href="/signup">
                무료로 시작하기
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="w-full cursor-pointer gap-2 sm:w-auto">
              <Play className="h-4 w-4" />
              데모 영상 보기
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="text-muted-foreground mt-8 flex items-center justify-center gap-6 text-sm"
          >
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="text-primary h-4 w-4" />
              무료 체험 3회
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="text-primary h-4 w-4" />
              카드 등록 불필요
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="text-primary h-4 w-4" />
              즉시 시작
            </span>
          </motion.div>
        </div>

        {/* Product Preview Mock */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mx-auto mt-16 max-w-4xl"
        >
          <div className="border-border/50 bg-card shadow-primary/5 overflow-hidden rounded-2xl border shadow-2xl">
            <div className="border-border/50 bg-muted/30 flex items-center gap-2 border-b px-4 py-3">
              <div className="h-3 w-3 rounded-full bg-red-400/70" />
              <div className="h-3 w-3 rounded-full bg-yellow-400/70" />
              <div className="h-3 w-3 rounded-full bg-green-400/70" />
              <span className="text-muted-foreground ml-2 text-xs">
                InterviewAI - 면접 시뮬레이션
              </span>
            </div>
            <div className="grid gap-4 p-6 md:grid-cols-3">
              <div className="md:col-span-2">
                <div className="aspect-video overflow-hidden rounded-xl bg-slate-900">
                  <iframe
                    className="h-full w-full"
                    src="https://www.youtube.com/embed/czAHB1PiZcM"
                    title="InterviewAI 면접 시뮬레이션 소개 영상"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                </div>
              </div>
              <div className="space-y-3">
                <div className="bg-muted/50 rounded-xl p-4">
                  <p className="text-muted-foreground mb-2 text-xs font-medium">AI 면접 질문</p>
                  <p className="text-sm font-medium">
                    본인의 가장 큰 강점은 무엇이라고 생각하시나요?
                  </p>
                </div>
                <div className="bg-primary/5 rounded-xl p-4">
                  <p className="text-primary mb-2 text-xs font-medium">남은 시간</p>
                  <p className="text-primary text-2xl font-bold">01:30</p>
                </div>
                <div className="flex gap-2">
                  <div className="bg-muted/50 flex-1 rounded-lg p-3 text-center">
                    <Mic className="text-muted-foreground mx-auto h-4 w-4" />
                  </div>
                  <div className="bg-primary flex-1 rounded-lg p-3 text-center">
                    <span className="text-primary-foreground text-xs font-medium">다음</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
