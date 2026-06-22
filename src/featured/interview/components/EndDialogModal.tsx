'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/shared/ui/dialog'
import type { useInterview } from '@/featured/interview/hooks/useInterview'
import { pauseInterviewAction } from '@/featured/interview/actions/interview.action'

interface EndDialogModalProps {
  session: ReturnType<typeof useInterview>
}

export function EndDialogModal({ session }: EndDialogModalProps) {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)

  const handlePause = async () => {
    if (session.interviewId === null) {
      router.push('/history')
      return
    }

    setIsPending(true)
    try {
      await pauseInterviewAction(session.interviewId)
    } catch (error) {
      console.error('면접 중단 처리 실패:', error)
    }
    router.push('/history')
  }

  return (
    <Dialog open={session.showEndDialog} onOpenChange={session.setShowEndDialog}>
      <DialogContent className="border-white/10 bg-slate-900 text-white">
        <DialogHeader>
          <DialogTitle>정말 면접을 중단하시겠습니까?</DialogTitle>
          <DialogDescription className="text-white/50">
            면접을 중단하면
            <span className="font-semibold text-red-400"> AI 분석 리포트가 생성되지 않습니다.</span>
            <br />
            모든 질문에 답변해야 AI 분석 리포트를 받을 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="ghost"
            className="cursor-pointer text-white/70 hover:bg-white/10 hover:text-white"
            onClick={() => session.setShowEndDialog(false)}
            disabled={isPending}
          >
            계속하기
          </Button>
          <Button
            variant="destructive"
            className="cursor-pointer"
            onClick={handlePause}
            disabled={isPending}
          >
            면접 중단
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
