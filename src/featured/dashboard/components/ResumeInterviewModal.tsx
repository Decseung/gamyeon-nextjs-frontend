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
import { InterviewReportItem } from '@/featured/history/types'
import { formatDateTimeKorean } from '@/shared/lib/utils/date'

interface ResumeInterviewModalProps {
  open: boolean
  onClose: () => void
  pausedRecords: InterviewReportItem[]
}

export function ResumeInterviewModal({ open, onClose, pausedRecords }: ResumeInterviewModalProps) {
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
          {pausedRecords.map((item) => (
            <div
              key={item.intvId}
              className="group border-border/50 flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-all hover:border-green-300 hover:shadow-md hover:shadow-green-600/5"
              onClick={() => handleResume(item.intvId)}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-green-100 to-emerald-100 transition-colors group-hover:from-green-200 group-hover:to-emerald-200">
                <RotateCw className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-muted-foreground mt-0.5 flex items-center gap-1 text-xs">
                  <Clock className="h-3 w-3" />
                  {formatDateTimeKorean(item.updatedAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
