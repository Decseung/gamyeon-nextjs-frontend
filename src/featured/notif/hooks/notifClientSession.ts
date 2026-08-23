'use client'

import { useNotifStore } from '../store'
import { invalidateNotifSession } from './useNotifActions'

let disconnectNotifs: () => void = () => undefined

/** SSE hook이 현재 연결을 종료하는 함수를 등록한다. */
export function registerNotifDisconnectHandler(handler: () => void): void {
  disconnectNotifs = handler
}

/** 인증 세션 경계를 넘어가면 안 되는 클라이언트 알림 상태를 정리한다. */
export function clearNotifClientSession(): void {
  disconnectNotifs()
  invalidateNotifSession()
  useNotifStore.getState().resetNotifs()
}
