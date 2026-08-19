import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { SETTINGS_COPY } from '../constants'
import { SettingsRow } from './SettingsRow'
import { WithdrawAccountDialog } from './WithdrawAccountDialog'

export function AccountManagementSection() {
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
        <WithdrawAccountDialog />
      </SettingsRow>
    </section>
  )
}
