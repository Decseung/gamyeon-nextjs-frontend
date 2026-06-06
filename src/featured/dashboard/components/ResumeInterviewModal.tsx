'use client'

import { RotateCw, Clock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/shared/ui/dialog'

interface PausedInterview {
  intvId: number
  intvTitle: string
  updatedAt: string
}

const MOCK_PAUSED_INTERVIEWS: PausedInterview[] = [
  { intvId: 1, intvTitle: '카카오 백엔드 면접', updatedAt: '2026-06-05T14:30:00' },
  { intvId: 2, intvTitle: '네이버 프론트엔드 면접', updatedAt: '2026-06-04T10:15:00' },
  { intvId: 3, intvTitle: '토스 풀스택 면접', updatedAt: '2026-06-03T18:00:00' },
]

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

interface ResumeInterviewModalProps {
  open: boolean
  onClose: () => void
}

export function ResumeInterviewModal({ open, onClose }: ResumeInterviewModalProps) {
  const router = useRouter()

  const handleResume = (intvId: number) => {
    onClose()
    router.push(`/interview?restart=true&id=${intvId}`)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose()
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>이어할 면접 선택</DialogTitle>
          <DialogDescription>일시 중단된 면접 목록입니다.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-2">
          {MOCK_PAUSED_INTERVIEWS.map((item) => (
            <div
              key={item.intvId}
              className="border-border/50 hover:bg-muted/30 flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors"
              onClick={() => handleResume(item.intvId)}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-50">
                <RotateCw className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium">{item.intvTitle}</p>
                <p className="text-muted-foreground mt-0.5 flex items-center gap-1 text-xs">
                  <Clock className="h-3 w-3" />
                  {formatDate(item.updatedAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
