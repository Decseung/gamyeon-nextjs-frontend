'use client'

import { RotateCw, Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/shared/ui/dialog'
import { Button } from '@/shared/ui/button'
import { InterviewReportItem } from '@/featured/history/types'

interface DeletePausedInterviewModalProps {
  open: boolean
  onClose: () => void
  pausedRecords: InterviewReportItem[]
  onDelete: (intvId: number) => void
}

export function DeletePausedInterviewModal({
  open,
  onClose,
  pausedRecords,
  onDelete,
}: DeletePausedInterviewModalProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose()
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>진행 중인 면접 목록</DialogTitle>
          <DialogDescription>삭제할 면접을 선택하세요.</DialogDescription>
        </DialogHeader>
        <ul className="flex flex-col gap-2 py-1">
          {pausedRecords.map((record) => (
            <li
              key={record.intvId}
              className="border-border/50 flex items-center gap-3 rounded-lg border p-3"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-50">
                <RotateCw className="h-3.5 w-3.5 text-green-600" />
              </div>
              <span className="flex-1 truncate text-sm font-medium">{record.title}</span>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`${record.title} 삭제`}
                className="text-muted-foreground hover:text-destructive h-8 w-8 shrink-0 cursor-pointer"
                onClick={() => onDelete(record.intvId)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  )
}
