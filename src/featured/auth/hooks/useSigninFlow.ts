'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/featured/auth/store'
import type { OAuthLoginData, RestoreAccountData, RestoreUser } from '@/featured/auth/types'
import type { ApiResponse } from '@/shared/lib/api/types'
import type { OAuthProvider } from '@/shared/ui/provider-icon'
import { generateCodeChallenge, generateCodeVerifier } from '@/shared/lib/utils/pkce'
import { clearNotifClientSession } from '@/featured/notif/hooks/notifClientSession'

const PKCE_VERIFIER_KEY = 'pkce_code_verifier'

function isOAuthProvider(value: string | null): value is OAuthProvider {
  return value === 'google' || value === 'kakao'
}

export function useSigninFlow() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { signin, isLoggedIn, logout } = useAuthStore()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle')
  const [provider, setProvider] = useState<OAuthProvider | null>(null)
  const [restoreUser, setRestoreUser] = useState<RestoreUser | null>(null)
  const [isRestoring, setIsRestoring] = useState(false)
  const [isClearingRestore, setIsClearingRestore] = useState(false)
  const calledRef = useRef(false)

  useEffect(() => {
    clearNotifClientSession()

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

        if (json.data.restoreRequired) {
          setRestoreUser({
            restorableUntil: json.data.restorableUntil,
            user: json.data.user,
          })
          setStatus('idle')
          return
        }

        if (!json.data.user) {
          setErrorMessage('로그인 인증에 실패했습니다.')
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

  const clearRestoreUser = async () => {
    if (!restoreUser || isRestoring || isClearingRestore) return

    setIsClearingRestore(true)
    setErrorMessage(null)

    try {
      const res = await fetch('/api/auth/restore', { method: 'DELETE' })

      if (!res.ok) {
        throw new Error('restore cleanup failed')
      }

      setRestoreUser(null)
    } catch {
      setErrorMessage('계정 복구 요청 취소에 실패했습니다. 다시 시도해 주세요.')
    } finally {
      setIsClearingRestore(false)
    }
  }

  const handleRestore = async () => {
    if (!restoreUser) return
    setIsRestoring(true)
    setErrorMessage(null)

    try {
      const res = await fetch('/api/auth/restore', {
        method: 'POST',
      })

      const json: ApiResponse<RestoreAccountData> = await res.json()

      if (!json.success || !json.data?.user) {
        setErrorMessage(json.message ?? '계정 복구에 실패했습니다.')
        setIsRestoring(false)
        return
      }

      signin(json.data.user)
      router.replace('/dashboard')
    } catch {
      setErrorMessage('서버 연결에 실패했습니다.')
      setIsRestoring(false)
    }
  }

  return {
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
  }
}
