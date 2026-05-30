import { useRef, useEffect, useCallback } from 'react'

interface RageClickOptions {
  limit?: number;     // 분노 클릭 기준 횟수 (기본값 3)
  cooldown?: number;  // 초기화 대기 시간 (기본값 2000ms)
}

export function useRageClick(
  onRageClick: () => void, 
  options: RageClickOptions = {}
) {
  const { limit = 3, cooldown = 2000 } = options;

  const clickCountRef = useRef(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // 1. 컴포넌트가 언마운트될 때 자동으로 타이머를 정리 (메모리 누수 방지 자동화)
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  // 2. 외부에서 사용할 클릭 핸들러 (useCallback으로 최적화)
  const handleContainerClick = useCallback(() => {
    clickCountRef.current += 1

    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    if (clickCountRef.current >= limit) {
      onRageClick()
      clickCountRef.current = 0
      return
    }

    timerRef.current = setTimeout(() => {
      clickCountRef.current = 0
    }, cooldown)
  }, [onRageClick, limit, cooldown])

  // 이제 외부로 굳이 타이머 클리어 함수를 내보내지 않아도 안전합니다!
  return { handleContainerClick }
}