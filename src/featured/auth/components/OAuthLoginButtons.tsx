'use client'

import Link from 'next/link'
import { Button } from '@/shared/ui/button'
import { ProviderIcon } from '@/shared/ui/provider-icon'

interface OAuthLoginButtonsProps {
  handleKakaoLogin: () => void
  handleGoogleLogin: () => void
}

export function OAuthLoginButtons({ handleKakaoLogin, handleGoogleLogin }: OAuthLoginButtonsProps) {
  return (
    <>
      <div className="flex flex-col gap-2.5">
        <Button
          type="button"
          className="w-full cursor-pointer gap-2.5 bg-[#FEE500] py-6 font-medium text-[#3C1E1E] transition-colors hover:bg-[#F0D900] active:bg-[#E8CF00]"
          onClick={handleKakaoLogin}
        >
          <ProviderIcon provider="kakao" className="h-5 w-5 shrink-0" />
          카카오로 시작하기
        </Button>
        <Button
          type="button"
          variant="outline"
          className="active:bg-muted/50 w-full cursor-pointer gap-2.5 py-6 transition-colors"
          onClick={handleGoogleLogin}
        >
          <ProviderIcon provider="google" className="h-4 w-4 shrink-0" />
          Google로 시작하기
        </Button>
      </div>

      <p className="text-muted-foreground mt-4 text-center text-xs">
        계속 진행하면{' '}
        <Link href="/terms" className="text-primary cursor-pointer font-medium hover:underline">
          이용약관
        </Link>{' '}
        및{' '}
        <Link href="/privacy" className="text-primary cursor-pointer font-medium hover:underline">
          개인정보 처리 방침
        </Link>
        에 동의하는 것으로 간주됩니다.
      </p>
    </>
  )
}
