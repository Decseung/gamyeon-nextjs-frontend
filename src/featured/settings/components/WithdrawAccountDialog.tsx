'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { withdrawUserAction } from '@/featured/auth/actions/auth.action'
import {
  createWithdrawalCompletionPayload,
  WITHDRAWAL_COMPLETION_STORAGE_KEY,
} from '@/featured/auth/lib/withdrawal-completion'
import { useAuthStore } from '@/featured/auth/store'
import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog'

export function WithdrawAccountDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [hasAcknowledged, setHasAcknowledged] = useState(false)
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const userEmail = useAuthStore((state) => state.user?.email)

  const handleWithdraw = async () => {
    if (!hasAcknowledged || isWithdrawing) return

    const completionPayload = createWithdrawalCompletionPayload(userEmail)

    try {
      sessionStorage.setItem(WITHDRAWAL_COMPLETION_STORAGE_KEY, JSON.stringify(completionPayload))
    } catch {
      toast.error('탈퇴 안내를 준비하지 못했습니다. 다시 시도해 주세요.')
      return
    }

    setIsWithdrawing(true)
    const result = await withdrawUserAction()
    if (!result.success) {
      sessionStorage.removeItem(WITHDRAWAL_COMPLETION_STORAGE_KEY)
      toast.error(result.message ?? '회원 탈퇴에 실패했습니다.')
      setIsWithdrawing(false)
      return
    }

    window.location.replace('/signin?withdrawal=complete')
  }

  const handleOpenChange = (open: boolean) => {
    if (isWithdrawing) return

    setIsOpen(open)
    if (!open) setHasAcknowledged(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="secondary"
          size="sm"
          className="cursor-pointer bg-gray-200 text-gray-500 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
        >
          회원 탈퇴
        </Button>
      </DialogTrigger>
      <DialogContent
        className="gap-0 overflow-hidden p-0 sm:max-w-[480px]"
        showCloseButton={!isWithdrawing}
      >
        <DialogHeader className="gap-2 px-6 pt-6 pr-14 text-left">
          <div className="space-y-1.5">
            <DialogTitle className="text-xl leading-tight">회원 탈퇴 전 확인해 주세요</DialogTitle>
            <DialogDescription className="leading-6">
              탈퇴하면 계정이 즉시 비활성화되고 서비스를 이용할 수 없습니다.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="space-y-5 px-6 pt-5 pb-6">
          <div className="space-y-4">
            <p className="text-muted-foreground text-sm leading-6">
              탈퇴 후 <strong className="text-foreground font-semibold">7일 동안</strong> 다시
              로그인하면 계정을 복구할 수 있습니다. 이후에는 아래 정보가 영구 삭제되어 복구할 수
              없습니다.
            </p>

            <div className="border-destructive/50 border-l-2 pl-4">
              <p className="text-destructive text-sm font-semibold">영구 삭제되는 정보</p>
              <ul className="text-foreground/80 marker:text-destructive mt-2 list-disc space-y-1 pl-4 text-sm leading-5">
                <li>계정 및 프로필 정보</li>
                <li>모든 면접 기록과 분석 리포트</li>
              </ul>
            </div>
          </div>

          <label
            htmlFor="withdrawal-acknowledgement"
            className="flex cursor-pointer items-start gap-3"
          >
            <input
              id="withdrawal-acknowledgement"
              type="checkbox"
              checked={hasAcknowledged}
              disabled={isWithdrawing}
              onChange={(event) => setHasAcknowledged(event.target.checked)}
              className="accent-destructive mt-0.5 size-4 shrink-0 cursor-pointer disabled:cursor-not-allowed"
            />
            <span className="text-sm leading-5 font-medium">
              위 내용을 확인했으며, 7일 후 모든 데이터가 영구 삭제되는 것에 동의합니다.
            </span>
          </label>
        </div>

        <DialogFooter className="px-6 pb-6 sm:justify-stretch">
          <DialogClose asChild>
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer sm:flex-1"
              disabled={isWithdrawing}
            >
              취소
            </Button>
          </DialogClose>
          <Button
            type="button"
            variant="destructive"
            className="cursor-pointer sm:flex-1"
            disabled={!hasAcknowledged || isWithdrawing}
            onClick={() => void handleWithdraw()}
          >
            {isWithdrawing ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                탈퇴 처리 중
              </>
            ) : (
              '동의하고 탈퇴하기'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
