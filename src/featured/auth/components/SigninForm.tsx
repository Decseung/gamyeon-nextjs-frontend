'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader } from '@/shared/ui/card'
import { Separator } from '@/shared/ui/separator'
import Image from 'next/image'
import { useAuthStore } from '@/featured/auth/store'
import type { OAuthLoginData } from '@/featured/auth/types'
import type { ApiResponse } from '@/shared/lib/api/types'
import { generateCodeVerifier, generateCodeChallenge } from '@/shared/lib/utils/pkce'

const PKCE_VERIFIER_KEY = 'pkce_code_verifier'

export function SigninForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { signin } = useAuthStore()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle')
  const [provider, setProvider] = useState<string | null>(null)
  const calledRef = useRef(false)

  useEffect(() => {
    const error = searchParams.get('error')
    if (error) {
      setErrorMessage('로그인 인증에 실패했습니다.')
      return
    }

    const code = searchParams.get('code')
    const currentProvider = searchParams.get('state')
    if (!code || !currentProvider) return

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

        signin(json.data.user, json.data.accessToken)
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
      scope: process.env.NEXT_PUBLIC_KAKAO_SCOPE!,
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
              {isKakao ? (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#3C1E1E" aria-hidden="true">
                  <path d="M12 3C6.477 3 2 6.477 2 10.8c0 2.7 1.617 5.076 4.077 6.54l-.977 3.642a.3.3 0 0 0 .44.327l4.217-2.79A12.2 12.2 0 0 0 12 18.6c5.523 0 10-3.477 10-7.8S17.523 3 12 3z" />
                </svg>
              ) : (
                <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
              )}
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
                <svg
                  className="h-5 w-5 shrink-0"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M12 3C6.477 3 2 6.477 2 10.8c0 2.7 1.617 5.076 4.077 6.54l-.977 3.642a.3.3 0 0 0 .44.327l4.217-2.79A12.2 12.2 0 0 0 12 18.6c5.523 0 10-3.477 10-7.8S17.523 3 12 3z" />
                </svg>
                카카오로 시작하기
              </Button>

              {/* 구글 로그인 버튼 */}
              <Button
                type="button"
                variant="outline"
                className="active:bg-muted/50 w-full cursor-pointer gap-2.5 py-6 transition-colors"
                onClick={handleGoogleLogin}
              >
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
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
