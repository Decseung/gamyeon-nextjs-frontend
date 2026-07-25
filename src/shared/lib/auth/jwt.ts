import { parseSetCookieExpires } from '@/shared/lib/utils/cookie'

// 쿠키가 JWT보다 먼저 만료되도록 여유를 둔다. 이 여유 덕분에 accessToken이
// 실제로 죽기 전에 브라우저가 쿠키를 지우고, proxy가 그 부재를 감지해
// (쿠키 쓰기가 가능한) proxy 계층에서 재발급이 일어나도록 유도한다.
const ACCESS_TOKEN_EARLY_EXPIRY_MS = 30_000

// exp 클레임 디코딩에 실패했을 때(토큰 포맷 변경 등)를 대비한 최후 폴백.
// 현재 백엔드 정책(accessToken 1시간 / refreshToken 7일)과 일치시켜 둔다.
// 이 상수가 실제로 쓰이면 디코딩이 깨졌다는 신호이므로 반드시 로그를 남긴다.
const ACCESS_TOKEN_FALLBACK_MS = 60 * 60 * 1000
const REFRESH_TOKEN_FALLBACK_MS = 7 * 24 * 60 * 60 * 1000

/**
 * JWT payload의 exp(초 단위 Unix timestamp) 클레임을 디코딩한다.
 * 서명 검증은 하지 않으며, 만료 시각 추출 용도로만 사용한다.
 */
export function getJwtExpiry(token: string): Date | null {
  const payload = token.split('.')[1]
  if (!payload) return null

  try {
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')
    const decoded = JSON.parse(atob(padded))
    return typeof decoded.exp === 'number' ? new Date(decoded.exp * 1000) : null
  } catch {
    return null
  }
}

/**
 * accessToken/refreshToken 쿠키의 만료 시각을 계산한다.
 * 백엔드가 Set-Cookie로 만료 정보를 내려주면 그 값을 우선 사용하고,
 * 없으면(현재 백엔드는 토큰을 body로만 내려줌) JWT의 exp 클레임으로 대체한다.
 */
export function buildTokenExpiresMap(
  accessToken: string,
  refreshToken: string | undefined,
  setCookieHeaders: string[] = [],
): Map<string, Date> {
  const map = parseSetCookieExpires(setCookieHeaders)

  if (!map.has('accessToken')) {
    const exp = getJwtExpiry(accessToken)
    if (exp) {
      map.set('accessToken', new Date(exp.getTime() - ACCESS_TOKEN_EARLY_EXPIRY_MS))
    } else {
      console.error('[auth] accessToken exp 디코딩 실패 — 정책 기본값(1시간)으로 폴백합니다.')
      map.set('accessToken', new Date(Date.now() + ACCESS_TOKEN_FALLBACK_MS))
    }
  }

  if (refreshToken && !map.has('refreshToken')) {
    const exp = getJwtExpiry(refreshToken)
    if (exp) {
      map.set('refreshToken', exp)
    } else {
      console.error('[auth] refreshToken exp 디코딩 실패 — 정책 기본값(7일)으로 폴백합니다.')
      map.set('refreshToken', new Date(Date.now() + REFRESH_TOKEN_FALLBACK_MS))
    }
  }

  return map
}
