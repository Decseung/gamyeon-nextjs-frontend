export const WITHDRAWAL_COMPLETION_STORAGE_KEY = 'withdrawal-completion:v1'

const WITHDRAWAL_COMPLETION_MAX_AGE_MS = 10 * 60 * 1000
const KST_TIME_ZONE = 'Asia/Seoul'

export interface WithdrawalCompletionPayload {
  maskedEmail: string
  recoveryDeadline: string
  createdAt: number
}

function maskEmail(email: string | undefined) {
  if (!email) return '확인할 수 없는 계정'

  const atIndex = email.lastIndexOf('@')
  if (atIndex <= 0 || atIndex === email.length - 1) return '***'

  const localPart = email.slice(0, atIndex)
  const domain = email.slice(atIndex)
  const visibleLength = localPart.length >= 3 ? 2 : 1

  return `${localPart.slice(0, visibleLength)}***${domain}`
}

function getRecoveryDeadline(now: Date) {
  const dateParts = new Intl.DateTimeFormat('en-US', {
    timeZone: KST_TIME_ZONE,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(now)

  let year = 0
  let month = 0
  let day = 0

  for (const part of dateParts) {
    if (part.type === 'year') year = Number(part.value)
    if (part.type === 'month') month = Number(part.value)
    if (part.type === 'day') day = Number(part.value)
  }

  const recoveryDate = new Date(Date.UTC(year, month - 1, day + 7))
  const formattedDate = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(recoveryDate)

  return `${formattedDate} 오후 11:59`
}

export function createWithdrawalCompletionPayload(
  email: string | undefined,
  now = new Date(),
): WithdrawalCompletionPayload {
  return {
    maskedEmail: maskEmail(email),
    recoveryDeadline: getRecoveryDeadline(now),
    createdAt: now.getTime(),
  }
}

export function parseWithdrawalCompletionPayload(
  value: string | null,
  now = Date.now(),
): WithdrawalCompletionPayload | null {
  if (!value) return null

  try {
    const payload: unknown = JSON.parse(value)

    if (
      payload === null ||
      typeof payload !== 'object' ||
      !('maskedEmail' in payload) ||
      typeof payload.maskedEmail !== 'string' ||
      payload.maskedEmail.length === 0 ||
      !('recoveryDeadline' in payload) ||
      typeof payload.recoveryDeadline !== 'string' ||
      payload.recoveryDeadline.length === 0 ||
      !('createdAt' in payload) ||
      typeof payload.createdAt !== 'number'
    ) {
      return null
    }

    const age = now - payload.createdAt
    if (!Number.isFinite(age) || age < 0 || age > WITHDRAWAL_COMPLETION_MAX_AGE_MS) {
      return null
    }

    return payload as WithdrawalCompletionPayload
  } catch {
    return null
  }
}
