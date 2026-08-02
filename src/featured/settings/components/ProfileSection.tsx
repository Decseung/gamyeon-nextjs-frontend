'use client'

import { useId, useRef, useState, type FormEvent } from 'react'
import { CircleUserRound, SquarePen } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { useAuthStore } from '@/featured/auth/store'
import { updateNicknameAction } from '../actions/settings.action'
import { NICKNAME_PATTERN, SETTINGS_COPY } from '../constants'
import type { NicknameUpdateData } from '../types'
import { SettingsRow } from './SettingsRow'

interface NicknameEditorProps {
  initialNickname: string
}

interface SocialProviderIconProps {
  provider: string
}

function isValidNickname(nickname: string): boolean {
  return NICKNAME_PATTERN.test(nickname)
}

function isNicknameUpdateData(data: unknown): data is NicknameUpdateData {
  if (data === null || typeof data !== 'object') return false

  const value = data as Record<string, unknown>
  return (
    typeof value.id === 'number' &&
    Number.isInteger(value.id) &&
    value.id > 0 &&
    typeof value.nickname === 'string' &&
    isValidNickname(value.nickname)
  )
}

function GoogleIcon() {
  return (
    <svg className="size-5" viewBox="0 0 24 24" aria-hidden="true">
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
  )
}

function KakaoIcon() {
  return (
    <svg className="size-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 3C6.477 3 2 6.477 2 10.8c0 2.7 1.617 5.076 4.077 6.54l-.977 3.642a.3.3 0 0 0 .44.327l4.217-2.79A12.2 12.2 0 0 0 12 18.6c5.523 0 10-3.477 10-7.8S17.523 3 12 3z" />
    </svg>
  )
}

function SocialProviderIcon({ provider }: SocialProviderIconProps) {
  const normalizedProvider = provider.toLowerCase()

  if (normalizedProvider === 'google') {
    return (
      <span
        role="img"
        aria-label="Google 계정"
        title="Google"
        className="border-border bg-background flex size-8 items-center justify-center rounded-full border"
      >
        <GoogleIcon />
      </span>
    )
  }

  if (normalizedProvider === 'kakao') {
    return (
      <span
        role="img"
        aria-label="카카오 계정"
        title="카카오"
        className="flex size-8 items-center justify-center rounded-full bg-[#FEE500] text-black"
      >
        <KakaoIcon />
      </span>
    )
  }

  return (
    <span
      role="img"
      aria-label={`${provider} 계정`}
      title={provider}
      className="bg-secondary text-secondary-foreground flex size-8 items-center justify-center rounded-full"
    >
      <CircleUserRound className="size-5" aria-hidden="true" />
    </span>
  )
}

function NicknameEditor({ initialNickname }: NicknameEditorProps) {
  const [nickname, setNickname] = useState(initialNickname)
  const [isEditing, setIsEditing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const submissionLockRef = useRef(false)
  const errorId = useId()
  const updateNicknameInStore = useAuthStore((state) => state.updateNickname)

  const isNicknameValid = isValidNickname(nickname)
  const isNicknameUnchanged = nickname === initialNickname
  const validationError = isNicknameValid
    ? null
    : '닉네임은 1~8자의 한글, 영문, 숫자만 입력해 주세요.'
  const errorMessage = serverError ?? validationError
  const isSaveDisabled = isSubmitting || !isNicknameValid || isNicknameUnchanged

  const cancelEditing = () => {
    if (submissionLockRef.current) return

    setNickname(initialNickname)
    setServerError(null)
    setIsEditing(false)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (submissionLockRef.current || isSaveDisabled) return

    submissionLockRef.current = true
    setIsSubmitting(true)
    setServerError(null)

    try {
      const result = await updateNicknameAction(nickname)

      if (result.success) {
        if (!isNicknameUpdateData(result.data)) {
          const message = '닉네임 수정 결과를 확인하지 못했습니다.'
          setServerError(message)
          return
        }

        const updated = updateNicknameInStore(result.data.id, result.data.nickname)
        if (!updated) return

        setIsEditing(false)
        return
      }

      const nicknameError = result.errors?.find((error) => error.field === 'nickname')?.reason
      setServerError(nicknameError ?? result.message)
    } catch {
      const message = '닉네임 수정 중 오류가 발생했습니다.'
      setServerError(message)
    } finally {
      submissionLockRef.current = false
      setIsSubmitting(false)
    }
  }

  if (!isEditing) {
    return (
      <>
        <span className="min-w-0 flex-1 truncate text-sm">{initialNickname || '-'}</span>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => {
            setNickname(initialNickname)
            setServerError(null)
            setIsEditing(true)
          }}
          aria-label="닉네임 수정"
          title="닉네임 수정"
        >
          <SquarePen aria-hidden="true" />
        </Button>
      </>
    )
  }

  return (
    <form className="flex min-w-0 flex-1 flex-wrap items-center gap-2" onSubmit={handleSubmit}>
      <Input
        autoFocus
        value={nickname}
        onChange={(event) => {
          setNickname(event.target.value)
          setServerError(null)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && e.nativeEvent.isComposing) {
            e.preventDefault()
            return
          }

          if (e.key === 'Escape') {
            cancelEditing()
          }
        }}
        maxLength={8}
        disabled={isSubmitting}
        placeholder="닉네임"
        className="h-9 min-w-0 flex-1"
        aria-label="닉네임"
        aria-invalid={Boolean(errorMessage)}
        aria-describedby={errorMessage ? errorId : undefined}
      />
      <Button type="submit" size="sm" disabled={isSaveDisabled}>
        {isSubmitting ? '저장 중...' : '저장'}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={cancelEditing}
        disabled={isSubmitting}
      >
        취소
      </Button>
      <p id={errorId} role="alert" className="text-destructive min-h-4 basis-full text-xs">
        {errorMessage}
      </p>
    </form>
  )
}

export function ProfileSection() {
  const { user } = useAuthStore()

  const initials = user?.nickname ? user.nickname.slice(0, 1) : 'U'
  const nicknameEditorKey = `${user?.id ?? user?.email ?? 'guest'}:${user?.nickname ?? ''}`

  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold">{SETTINGS_COPY.profileTitle}</h3>
      <div className="flex min-h-[4.25rem] items-start gap-3">
        <Avatar className="h-12 w-12">
          {user?.avatar && <AvatarImage src={user.avatar} alt={user.nickname} />}
          <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="mt-2 flex min-w-0 flex-1 items-center gap-2">
          <NicknameEditor key={nicknameEditorKey} initialNickname={user?.nickname ?? ''} />
        </div>
      </div>
      <SettingsRow label="이메일">
        <span className="text-muted-foreground text-sm">{user?.email ?? '-'}</span>
      </SettingsRow>
      {user?.provider && (
        <SettingsRow label="연결된 소셜 계정">
          <SocialProviderIcon provider={user.provider} />
        </SettingsRow>
      )}
    </section>
  )
}
