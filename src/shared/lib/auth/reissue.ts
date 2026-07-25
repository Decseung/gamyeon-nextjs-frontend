import { buildTokenExpiresMap } from './jwt'

interface ReissueSuccess {
  ok: true
  accessToken: string
  refreshToken?: string
  expiresMap: Map<string, Date>
}

interface ReissueFailure {
  ok: false
  /** invalid: 백엔드가 명시적으로 거부(재로그인 필요). network: 일시적 오류(재시도 여지 있음) */
  reason: 'invalid' | 'network'
  code?: string
  message?: string
}

export type ReissueResult = ReissueSuccess | ReissueFailure

async function requestReissue(refreshToken: string): Promise<ReissueResult> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '')

  let res: Response
  try {
    res = await fetch(`${apiUrl}/api/v1/auth/reissue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
  } catch {
    return { ok: false, reason: 'network' }
  }

  // 5xx/429는 백엔드가 아닌 인프라(게이트웨이, rate limiter 등)의 일시적 실패일 수 있다.
  if (res.status >= 500 || res.status === 429) {
    return { ok: false, reason: 'network' }
  }

  const data = await res.json().catch(() => null)

  // JSON으로 파싱되지 않는 응답(WAF/게이트웨이의 HTML 에러 페이지 등)은
  // 백엔드가 명시적으로 거부한 것이 아니므로 일시적 실패로 취급한다.
  if (data === null) {
    return { ok: false, reason: 'network' }
  }

  if (!data.success || !data.data?.accessToken) {
    return { ok: false, reason: 'invalid', code: data.code, message: data.message }
  }

  return {
    ok: true,
    accessToken: data.data.accessToken,
    refreshToken: data.data.refreshToken,
    expiresMap: buildTokenExpiresMap(
      data.data.accessToken,
      data.data.refreshToken,
      res.headers.getSetCookie?.() ?? [],
    ),
  }
}

// 만료 시점에 몰리는 동시 요청(같은 서버 인스턴스 내 proxy/RSC/Server Action)이
// 같은 refreshToken을 중복 제출하지 않도록 in-flight 요청을 공유한다. (single-flight)
const inflightReissue = new Map<string, Promise<ReissueResult>>()

/**
 * refreshToken으로 accessToken을 재발급받는다.
 * 동일 refreshToken에 대한 동시 호출은 하나의 요청으로 병합된다(single-flight).
 * 쿠키 저장은 호출부(proxy / Route Handler / serverApi)의 책임이다.
 */
export function reissue(refreshToken: string): Promise<ReissueResult> {
  const existing = inflightReissue.get(refreshToken)
  if (existing) return existing

  const promise = requestReissue(refreshToken).finally(() => inflightReissue.delete(refreshToken))
  inflightReissue.set(refreshToken, promise)
  return promise
}
