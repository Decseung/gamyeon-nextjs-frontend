'use client'

import { ChevronRight } from 'lucide-react'
import { Button } from '@/shared/ui/button'

interface SetupFooterProps {
  disabled: boolean
  onCancel: () => void
  onStart: () => Promise<void>
}

export function SetupFooter({ disabled, onCancel, onStart }: SetupFooterProps) {
  return (
    <div className="border-border/50 flex items-center justify-between border-t px-8 py-4">
      <Button variant="ghost" size="sm" onClick={onCancel} className="cursor-pointer">
        취소
      </Button>
      <Button disabled={disabled} onClick={onStart} className="cursor-pointer gap-2">
        면접 시작하기
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}