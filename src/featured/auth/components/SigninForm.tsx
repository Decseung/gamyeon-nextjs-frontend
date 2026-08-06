'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader } from '@/shared/ui/card'
import { Separator } from '@/shared/ui/separator'
import Image from 'next/image'
import { useSigninFlow } from '@/featured/auth/hooks/useSigninFlow'
import { SigninLoadingScreen } from './SigninLoadingScreen'
import { SigninSuccessScreen } from './SigninSuccessScreen'
import { RestoreAccountModal } from './RestoreAccountModal'
import { SigninErrorMessage } from './SigninErrorMessage'
import { OAuthLoginButtons } from './OAuthLoginButtons'
import { WithdrawalCompleteModal } from './WithdrawalCompleteModal'
import {
  parseWithdrawalCompletionPayload,
  WITHDRAWAL_COMPLETION_STORAGE_KEY,
  type WithdrawalCompletionPayload,
} from '@/featured/auth/lib/withdrawal-completion'

export function SigninForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const withdrawalStatus = searchParams.get('withdrawal')
  const [withdrawalCompletion, setWithdrawalCompletion] =
    useState<WithdrawalCompletionPayload | null>(null)
  const {
    status,
    provider,
    errorMessage,
    restoreUser,
    isRestoring,
    isClearingRestore,
    clearRestoreUser,
    handleRestore,
    handleKakaoLogin,
    handleGoogleLogin,
  } = useSigninFlow()

  useEffect(() => {
    if (withdrawalStatus !== 'complete') return

    const storedPayload = sessionStorage.getItem(WITHDRAWAL_COMPLETION_STORAGE_KEY)
    sessionStorage.removeItem(WITHDRAWAL_COMPLETION_STORAGE_KEY)
    const completionPayload = parseWithdrawalCompletionPayload(storedPayload)

    router.replace('/signin')
    // sessionStorage는 클라이언트에서만 읽을 수 있어 마운트 후 일회성 안내를 복원한다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (completionPayload) setWithdrawalCompletion(completionPayload)
  }, [router, withdrawalStatus])

  if (status === 'loading') {
    if (!provider) return null
    return <SigninLoadingScreen provider={provider} />
  }

  if (status === 'success') {
    return <SigninSuccessScreen />
  }

  return (
    <div className="bg-muted/20 flex min-h-screen items-center justify-center px-4">
      <WithdrawalCompleteModal
        completion={withdrawalCompletion}
        onOpenChange={(open) => {
          if (!open) setWithdrawalCompletion(null)
        }}
      />
      {restoreUser && (
        <RestoreAccountModal
          restoreUser={restoreUser}
          errorMessage={errorMessage}
          isRestoring={isRestoring}
          isClearingRestore={isClearingRestore}
          clearRestoreUser={clearRestoreUser}
          handleRestore={handleRestore}
          handleKakaoLogin={handleKakaoLogin}
          handleGoogleLogin={handleGoogleLogin}
        />
      )}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="mb-4 text-center">
          <Link href="/" className="text-foreground inline-flex items-center justify-center">
            <Image
              src="/images/Gamyeon_Logo.png"
              alt="Gamyeon 홈으로 이동"
              width={1024}
              height={768}
              priority
              style={{ height: '44px', width: 'auto' }}
            />
          </Link>
        </div>

        <Card className="border-border/50 py-6 shadow-sm">
          <CardHeader className="text-center">
            <h1 className="text-2xl font-bold text-balance">환영합니다!</h1>
            <p className="text-muted-foreground text-sm text-pretty">
              면접을 진행하시려면 로그인 후 이용해주세요
            </p>
          </CardHeader>
          <Separator className="mx-6 w-auto!" />

          <CardContent className="space-y-4 pt-4">
            {!restoreUser && errorMessage && <SigninErrorMessage message={errorMessage} />}
            <OAuthLoginButtons
              handleKakaoLogin={handleKakaoLogin}
              handleGoogleLogin={handleGoogleLogin}
            />
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
