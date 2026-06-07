'use client'

import { useRouter } from 'next/navigation'
import { Play, RotateCw } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { Button } from '@/shared/ui/button'

interface InterviewStartGuideModalProps {
  open: boolean
  onClose: () => void
  onResume: () => void
}

export function InterviewStartGuideModal({
  open,
  onClose,
  onResume,
}: InterviewStartGuideModalProps) {
  const router = useRouter()

  const handleResume = () => {
    onClose()
    setTimeout(onResume, 200)
  }

  const handleStartNew = () => {
    onClose()
    router.push('/interview')
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
          <DialogTitle>진행 중인 면접이 있어요</DialogTitle>
          <DialogDescription>
            이어서 진행하시겠어요, 아니면 새로운 면접을 시작하시겠어요?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" className="cursor-pointer" onClick={handleResume}>
            <RotateCw className="h-4 w-4" />
            이어하기
          </Button>
          <Button className="cursor-pointer" onClick={handleStartNew}>
            <Play className="h-4 w-4" />
            면접 시작
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
