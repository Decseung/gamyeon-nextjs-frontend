'use client'

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { Button } from '@/shared/ui/button'
import type { WithdrawalCompletionPayload } from '@/featured/auth/lib/withdrawal-completion'

interface WithdrawalCompleteModalProps {
  completion: WithdrawalCompletionPayload | null
  onOpenChange: (open: boolean) => void
}

export function WithdrawalCompleteModal({
  completion,
  onOpenChange,
}: WithdrawalCompleteModalProps) {
  return (
    <Dialog open={completion !== null} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 p-0 sm:max-w-[440px]">
        <DialogHeader className="gap-2 px-6 pt-6 pr-14 text-left sm:px-7 sm:pt-7 sm:pr-14">
          <DialogTitle className="text-xl leading-tight">회원 탈퇴가 완료되었습니다</DialogTitle>
          <DialogDescription className="leading-6">
            탈퇴 처리가 정상적으로 완료되었습니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-6 pt-5 pb-6 sm:px-7">
          <dl className="space-y-3 text-sm">
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-muted-foreground shrink-0">탈퇴 계정</dt>
              <dd className="min-w-0 truncate text-right font-medium">{completion?.maskedEmail}</dd>
            </div>
            <div className="space-y-1">
              <dt className="text-muted-foreground">복구 가능 기간</dt>
              <dd className="text-base leading-6 font-semibold">
                {completion?.recoveryDeadline}까지
              </dd>
            </div>
          </dl>

          <p className="text-muted-foreground text-sm leading-6">
            기간 안에 다시 로그인하면 계정을 복구할 수 있습니다. 이후에는 계정과 모든 데이터가 영구
            삭제됩니다.
          </p>
        </div>

        <DialogFooter className="px-6 pb-6 sm:px-7 sm:pb-7">
          <DialogClose asChild>
            <Button type="button" className="w-full cursor-pointer">
              확인
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
