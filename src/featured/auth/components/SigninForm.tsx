'use client'

import Link from 'next/link'
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

export function SigninForm() {
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

  if (status === 'loading') {
    if (!provider) return null
    return <SigninLoadingScreen provider={provider} />
  }

  if (status === 'success') {
    return <SigninSuccessScreen />
  }

  return (
    <div className="bg-muted/20 flex min-h-screen items-center justify-center px-4">
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
