'use client'

import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { ProviderIcon, type OAuthProvider } from '@/shared/ui/provider-icon'

interface SigninLoadingScreenProps {
  provider: OAuthProvider
}

export function SigninLoadingScreen({ provider }: SigninLoadingScreenProps) {
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
