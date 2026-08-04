'use client'

import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { ProviderIcon } from '@/shared/ui/provider-icon'
import type { RestoreUser } from '@/featured/auth/types'
import { SigninErrorMessage } from './SigninErrorMessage'

interface RestoreAccountModalProps {
  restoreUser: RestoreUser
  errorMessage: string | null
  isRestoring: boolean
  clearRestoreUser: () => void
  handleRestore: () => void
  handleKakaoLogin: () => void
  handleGoogleLogin: () => void
}

export function RestoreAccountModal({
  restoreUser,
  errorMessage,
  isRestoring,
  clearRestoreUser,
  handleRestore,
  handleKakaoLogin,
  handleGoogleLogin,
}: RestoreAccountModalProps) {
  return (
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
        <p className="text-muted-foreground mb-4 text-center text-sm">{restoreUser.user?.email}</p>
        {errorMessage && <SigninErrorMessage message={errorMessage} />}
        {errorMessage ? (
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              className="w-full cursor-pointer gap-2.5 bg-[#FEE500] font-medium text-[#3C1E1E] hover:bg-[#F0D900] active:bg-[#E8CF00]"
              onClick={handleKakaoLogin}
            >
              <ProviderIcon provider="kakao" className="h-5 w-5 shrink-0" />
              카카오 로그인
            </Button>
            <Button
              type="button"
              variant="outline"
              className="active:bg-muted/50 w-full cursor-pointer gap-2.5"
              onClick={handleGoogleLogin}
            >
              <ProviderIcon provider="google" className="h-4 w-4 shrink-0" />
              구글 로그인
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full cursor-pointer"
              disabled={isRestoring}
              onClick={handleRestore}
            >
              {isRestoring ? <Loader2 className="h-4 w-4 animate-spin" /> : '복구 재시도'}
            </Button>
          </div>
        ) : (
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
        )}
      </motion.div>
    </motion.div>
  )
}
