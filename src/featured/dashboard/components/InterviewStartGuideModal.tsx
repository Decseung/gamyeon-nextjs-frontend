'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Play, RotateCw } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/shared/ui/dialog'
import { Button } from '@/shared/ui/button'
import { InterviewReportItem } from '@/featured/history/types'
import { DeletePausedInterviewModal } from './DeletePausedInterviewModal'

const MAX_PAUSED_COUNT = 5

interface InterviewStartGuideModalProps {
  open: boolean
  onClose: () => void
  onResume: () => void
  pausedRecords: InterviewReportItem[]
}

export function InterviewStartGuideModal({
  open,
  onClose,
  onResume,
  pausedRecords,
}: InterviewStartGuideModalProps) {
  const router = useRouter()
  const [deletedIds, setDeletedIds] = useState<Set<number>>(new Set())
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  const visibleRecords = pausedRecords.filter((r) => !deletedIds.has(r.intvId))
  const isMaxPaused = visibleRecords.length >= MAX_PAUSED_COUNT

  const handleClose = () => {
    setDeletedIds(new Set())
    setIsDeleteModalOpen(false)
    onClose()
  }

  const handleDelete = (intvId: number) => {
    setDeletedIds((prev) => new Set(prev).add(intvId))
  }

  const handleResume = () => {
    handleClose()
    setTimeout(onResume, 200)
  }

  const handleStartNew = () => {
    handleClose()
    router.push('/interview')
  }

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(isOpen) => {
          if (!isOpen) handleClose()
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>진행 중인 면접이 있어요</DialogTitle>
            {!isMaxPaused && (
              <DialogDescription>
                이어서 진행하시겠어요, 아니면 새로운 면접을 시작하시겠어요?
              </DialogDescription>
            )}
          </DialogHeader>

          {isMaxPaused && (
            <p className="text-sm text-red-500">
              진행중인 면접은 최대 {MAX_PAUSED_COUNT}개 까지만 보관 가능합니다. 새로 면접을
              시작하시려면 진행중인 면접을 삭제 후 시작해주세요.
            </p>
          )}

          <DialogFooter>
            <Button variant="outline" className="cursor-pointer" onClick={handleResume}>
              <RotateCw className="h-4 w-4" />
              이어하기
            </Button>
            <Button className="cursor-pointer" onClick={handleStartNew} disabled={isMaxPaused}>
              <Play className="h-4 w-4" />
              면접 시작
            </Button>
            {isMaxPaused && (
              <Button
                variant="outline"
                className="text-destructive border-destructive/30 hover:bg-destructive/5 hover:text-destructive cursor-pointer"
                onClick={() => setIsDeleteModalOpen(true)}
              >
                삭제
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeletePausedInterviewModal
        open={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        pausedRecords={visibleRecords}
        onDelete={handleDelete}
      />
    </>
  )
}
