'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader } from '@/shared/ui/card'
import { ProviderIcon } from '@/shared/ui/provider-icon'
import { Separator } from '@/shared/ui/separator'
import Image from 'next/image'
import { useSigninFlow } from '@/featured/auth/hooks/useSigninFlow'

export function SigninForm() {
  const {
    status,
    provider,
    errorMessage,
    restoreUser,
    isRestoring,
    clearRestoreUser,
    handleRestore,
    handleKakaoLogin,
    handleGoogleLogin,
  } = useSigninFlow()

  if (status === 'loading') {
    if (!provider) return null

    const isKakao = provider === 'kakao'
    return (
      <div className="flex min-h-screen items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="relative flex h-16 w-16 items-center justify-center">
            <Loader2 className="text-muted-foreground/40 absolute h-16 w-16 animate-spin" />
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full"
              style={{
                backgroundColor: isKakao ? '#FEE500' : '#fff',
                border: isKakao ? 'none' : '1px solid #e5e7eb',
              }}
            >
              <ProviderIcon
                provider={provider}
                className={isKakao ? 'h-5 w-5' : 'h-4 w-4'}
                fill={isKakao ? '#3C1E1E' : undefined}
              />
            </div>
          </div>
          <p className="text-muted-foreground text-sm">
            {isKakao ? '카카오' : 'Google'} 로그인 처리 중...
          </p>
        </motion.div>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="bg-primary/10 flex h-16 w-16 items-center justify-center rounded-full">
            <motion.svg
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="text-primary h-8 w-8"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <motion.path
                d="M5 13l4 4L19 7"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              />
            </motion.svg>
          </div>
          <p className="text-foreground font-medium">로그인 성공!</p>
          <p className="text-muted-foreground text-sm">잠시 후 이동합니다...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="bg-muted/20 flex min-h-screen items-center justify-center px-4">
      {restoreUser && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="bg-background w-full max-w-sm rounded-2xl p-6 shadow-xl"
          >
            <h2 className="text-foreground mb-1 text-center text-base font-semibold">
              탈퇴한 계정을 복구하시겠습니까?
            </h2>
            <p className="text-muted-foreground mb-6 text-center text-sm">
              {restoreUser.user.email}
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 cursor-pointer"
                disabled={isRestoring}
                onClick={clearRestoreUser}
              >
                취소
              </Button>
              <Button
                type="button"
                className="flex-1 cursor-pointer"
                disabled={isRestoring}
                onClick={handleRestore}
              >
                {isRestoring ? <Loader2 className="h-4 w-4 animate-spin" /> : '복구'}
              </Button>
            </div>
          </motion.div>
        </motion.div>
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
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-destructive/10 border-destructive/20 flex items-start gap-2.5 rounded-lg border px-4 py-3"
              >
                <svg
                  className="text-destructive mt-0.5 h-4 w-4 shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <p className="text-destructive text-sm">{errorMessage}</p>
              </motion.div>
            )}

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
              <Link
                href="/terms"
                className="text-primary cursor-pointer font-medium hover:underline"
              >
                이용약관
              </Link>{' '}
              및{' '}
              <Link
                href="/privacy"
                className="text-primary cursor-pointer font-medium hover:underline"
              >
                개인정보 처리 방침
              </Link>
              에 동의하는 것으로 간주됩니다.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
