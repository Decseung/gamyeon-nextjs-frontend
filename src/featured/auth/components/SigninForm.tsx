'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader } from '@/shared/ui/card'
import { ProviderIcon, type OAuthProvider } from '@/shared/ui/provider-icon'
import { Separator } from '@/shared/ui/separator'
import Image from 'next/image'
import { useAuthStore } from '@/featured/auth/store'
import type { OAuthLoginData } from '@/featured/auth/types'
import type { ApiResponse } from '@/shared/lib/api/types'
import { generateCodeVerifier, generateCodeChallenge } from '@/shared/lib/utils/pkce'

const PKCE_VERIFIER_KEY = 'pkce_code_verifier'

function isOAuthProvider(value: string | null): value is OAuthProvider {
  return value === 'google' || value === 'kakao'
}

export function SigninForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { signin, isLoggedIn, logout } = useAuthStore()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle')
  const [provider, setProvider] = useState<OAuthProvider | null>(null)
  const calledRef = useRef(false)

  useEffect(() => {
    // proxy가 쿠키 만료/거부로 이 페이지에 강제 리다이렉트한 경우, sessionStorage에
    // 남아있는 로그인 상태(user/isLoggedIn)가 실제 쿠키 상태와 어긋날 수 있다.
    // /signin 도달 자체가 비로그인 확정이므로 여기서 리셋한다.
    if (isLoggedIn) logout()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const error = searchParams.get('error')
    if (error) {
      setErrorMessage('로그인 인증에 실패했습니다.')
      return
    }

    const code = searchParams.get('code')
    const currentProvider = searchParams.get('state')
    if (!code) return
    if (!isOAuthProvider(currentProvider)) {
      setErrorMessage('지원하지 않는 로그인 제공자입니다.')
      return
    }

    if (calledRef.current) return
    calledRef.current = true

    setProvider(currentProvider)

    const controller = new AbortController()
    let timeoutId: ReturnType<typeof setTimeout> | null = null

    const loginWithOAuth = async () => {
      setStatus('loading')
      setErrorMessage(null)

      try {
        const codeVerifier = sessionStorage.getItem(PKCE_VERIFIER_KEY)
        sessionStorage.removeItem(PKCE_VERIFIER_KEY)

        const res = await fetch(`/api/auth/${currentProvider}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ authorizationCode: code, codeVerifier }),
          signal: controller.signal,
        })

        const json: ApiResponse<OAuthLoginData> = await res.json()

        if (!json.success || !json.data) {
          setErrorMessage(json.message ?? '로그인 인증에 실패했습니다.')
          setStatus('idle')
          return
        }

        signin(json.data.user)
        setStatus('success')
        timeoutId = setTimeout(() => router.replace('/dashboard'), 700)
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
        setErrorMessage('서버 연결에 실패했습니다.')
        setStatus('idle')
      }
    }

    loginWithOAuth()

    return () => {
      controller.abort()
      if (timeoutId !== null) clearTimeout(timeoutId)
    }
  }, [searchParams, signin, router])

  const handleKakaoLogin = async () => {
    const verifier = generateCodeVerifier()
    const challenge = await generateCodeChallenge(verifier)

    sessionStorage.setItem(PKCE_VERIFIER_KEY, verifier)

    const params = new URLSearchParams({
      client_id: process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID!,
      redirect_uri: process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI!,
      response_type: process.env.NEXT_PUBLIC_KAKAO_RESPONSE_TYPE!,
      state: 'kakao',
      code_challenge: challenge,
      code_challenge_method: 'S256',
    })

    window.location.href = `${process.env.NEXT_PUBLIC_KAKAO_AUTH_URL}?${params.toString()}`
  }

  const handleGoogleLogin = async () => {
    const verifier = generateCodeVerifier()
    const challenge = await generateCodeChallenge(verifier)

    sessionStorage.setItem(PKCE_VERIFIER_KEY, verifier)

    const params = new URLSearchParams({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      redirect_uri: process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI!,
      response_type: process.env.NEXT_PUBLIC_GOOGLE_RESPONSE_TYPE!,
      scope: process.env.NEXT_PUBLIC_GOOGLE_SCOPE!,
      state: 'google',
      code_challenge: challenge,
      code_challenge_method: 'S256',
    })

    window.location.href = `${process.env.NEXT_PUBLIC_GOOGLE_AUTH_URL}?${params.toString()}`
  }

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
              {/* 카카오 로그인 버튼 */}
              <Button
                type="button"
                className="w-full cursor-pointer gap-2.5 bg-[#FEE500] py-6 font-medium text-[#3C1E1E] transition-colors hover:bg-[#F0D900] active:bg-[#E8CF00]"
                onClick={handleKakaoLogin}
              >
                <ProviderIcon provider="kakao" className="h-5 w-5 shrink-0" />
                카카오로 시작하기
              </Button>

              {/* 구글 로그인 버튼 */}
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
