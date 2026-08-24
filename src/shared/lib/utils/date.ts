/**
 * Date 객체를 "YYYY년 M월 D일" 포맷의 문자열로 변환합니다.
 * @param dateObj 변환할 Date 객체
 * @returns 예: "2026년 3월 5일"
 */
export const formatDateKorean = (dateObj: Date) => {
  return `${dateObj.getFullYear()}년 ${dateObj.getMonth() + 1}월 ${dateObj.getDate()}일`
}

/**
 * Date 객체를 "YYYY.MM.DD" 포맷의 문자열로 변환합니다.
 * @param dateObj 변환할 Date 객체
 * @returns 예: "2026.03.05"
 */
export const formatDateDot = (dateObj: Date) => {
  const year = dateObj.getFullYear()
  const month = String(dateObj.getMonth() + 1).padStart(2, '0')
  const day = String(dateObj.getDate()).padStart(2, '0')
  return `${year}.${month}.${day}`
}

/**
 * "YYYY.MM.DD" 포맷의 문자열을 Date 객체로 변환합니다.
 * @param dateStr 변환할 문자열 (예: "2026.03.05")
 * @returns Date 객체
 */
export const parseDateDot = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('.').map(Number)
  return new Date(year, month - 1, day)
}

/**
 * 주어진 날짜가 속한 주의 월요일을 반환합니다.
 * @param dateObj 기준 Date 객체
 * @returns 해당 주 월요일의 Date 객체 (시각 00:00:00)
 */
export const getMondayOf = (dateObj: Date): Date => {
  const d = new Date(dateObj)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

/**
 * 주어진 날짜에 n일을 더한 Date 객체를 반환합니다.
 * @param dateObj 기준 Date 객체
 * @param n 더할 일수 (음수 가능)
 * @returns n일 후의 Date 객체
 */
export const addDays = (dateObj: Date, n: number): Date => {
  const d = new Date(dateObj)
  d.setDate(d.getDate() + n)
  return d
}

/**
 * 주어진 날짜 문자열이 현재로부터 3일 이내인지 확인합니다.
 * @param dateString ISO 형식의 날짜 문자열
 * @returns 3일 이내이면 true
 */
export const checkIsRecent = (dateString: string): boolean => {
  const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000
  return new Date(dateString).getTime() > Date.now() - THREE_DAYS_MS
}

/**
 * ISO 날짜 문자열을 한국 시간대 기준의 월, 일, 시각 문자열로 변환합니다.
 * @param dateString ISO 형식의 날짜 문자열
 */
export const formatMonthDayTimeKorean = (dateString: string): string => {
  return new Date(dateString).toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

/**
 * 초(seconds)를 "M분 S초" 또는 "M분" 형식으로 변환합니다.
 * @param seconds 초 단위 숫자
 * @returns 예: 850 -> "14분 10초", 60 -> "1분"
 */
/**
 * ISO 날짜 문자열을 "YYYY년 M월 D일 HH:MM" 형식으로 변환합니다.
 * @param dateString ISO 형식의 날짜 문자열
 * @returns 예: "2026년 6월 12일 오전 10:30"
 */
export const formatDateTimeKorean = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const formatDuration = (seconds: number | null): string => {
  if (seconds === null || seconds === 0) return '0분'

  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60

  if (minutes === 0) return `${secs}초`
  if (secs === 0) return `${minutes}분`
  return `${minutes}분 ${secs}초`
}

export const formatDurationMs = (ms: number | null): string => {
  if (ms === null || ms === 0) return '0분'
  return formatDuration(Math.round(ms / 1000))
}
