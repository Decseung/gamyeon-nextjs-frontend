'use client'

import Link from 'next/link'
import { toast } from 'sonner'
import { ExternalLink } from 'lucide-react'
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
import { Button } from '@/shared/ui/button'
import { SETTINGS_COPY } from '../constants'
import { SettingsRow } from './SettingsRow'

export function AccountManagementSection() {
  const handleWithdraw = () => {
    toast.info(SETTINGS_COPY.withdrawPendingToast)
  }

  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold">{SETTINGS_COPY.accountTitle}</h3>
      <SettingsRow label="이용약관">
        <Button variant="ghost" size="sm" className="cursor-pointer gap-1.5" asChild>
          <Link href="/terms" target="_blank">
            보기
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </SettingsRow>
      <SettingsRow label="개인정보처리방침">
        <Button variant="ghost" size="sm" className="cursor-pointer gap-1.5" asChild>
          <Link href="/privacy" target="_blank">
            보기
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </SettingsRow>
      <SettingsRow label="회원 탈퇴" description="계정과 모든 면접 기록이 삭제됩니다.">
        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="secondary"
              size="sm"
              className="cursor-pointer bg-gray-200 text-gray-500 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            >
              회원 탈퇴
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>정말 탈퇴하시겠어요?</DialogTitle>
              <DialogDescription>
                탈퇴하면 계정 정보와 모든 면접 기록·리포트가 삭제되며 복구할 수 없습니다.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" className="cursor-pointer">
                  취소
                </Button>
              </DialogClose>
              <DialogClose asChild>
                <Button variant="destructive" className="cursor-pointer" onClick={handleWithdraw}>
                  탈퇴하기
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SettingsRow>
    </section>
  )
}
