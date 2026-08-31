'use client'

import Link from 'next/link'
import { ArrowLeft, Monitor } from 'lucide-react'
import { type ReactNode, useSyncExternalStore } from 'react'
import { Button } from '@/shared/ui/button'

const INTERVIEW_VIEWPORT_QUERY = '(min-width: 1024px)'

function subscribeToViewportChange(onStoreChange: () => void) {
  const mediaQuery = window.matchMedia(INTERVIEW_VIEWPORT_QUERY)
  mediaQuery.addEventListener('change', onStoreChange)

  return () => mediaQuery.removeEventListener('change', onStoreChange)
}

function getViewportSnapshot() {
  return window.matchMedia(INTERVIEW_VIEWPORT_QUERY).matches
}

function getServerViewportSnapshot() {
  return null
}

interface InterviewViewportGuardProps {
  children: ReactNode
}

export function InterviewViewportGuard({ children }: InterviewViewportGuardProps) {
  const isSupportedViewport = useSyncExternalStore(
    subscribeToViewportChange,
    getViewportSnapshot,
    getServerViewportSnapshot,
  )

  if (isSupportedViewport === null) {
    return <div className="min-h-dvh bg-slate-950" aria-hidden="true" />
  }

  if (!isSupportedViewport) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-slate-950 px-6 py-10 text-white">
        <section
          aria-labelledby="unsupported-viewport-title"
          className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-8 text-center shadow-2xl"
        >
          <div className="bg-primary/15 text-primary mx-auto flex h-16 w-16 items-center justify-center rounded-2xl">
            <Monitor className="h-8 w-8" aria-hidden="true" />
          </div>

          <h1 id="unsupported-viewport-title" className="mt-6 text-2xl font-bold tracking-tight">
            PC 환경에서 면접을 진행해 주세요
          </h1>
          <p className="mt-3 text-sm leading-6 text-white/65">
            안정적인 카메라 촬영과 AI 분석을 위해 가로 1024px 이상의 화면이 필요합니다.
          </p>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
            브라우저 창을 넓히면 면접 설정 화면이 자동으로 표시됩니다.
          </div>

          <Button asChild variant="secondary" className="mt-6 w-full">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
              대시보드로 돌아가기
            </Link>
          </Button>
        </section>
      </main>
    )
  }

  return children
}
