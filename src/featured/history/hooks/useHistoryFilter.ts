import { useState, useMemo } from 'react'
import type { SortBy, InterviewReportItem } from '../types'
import { getReportCardType } from '../constants'

export function useHistoryFilter(records: InterviewReportItem[] = []) {
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<SortBy>('date')

  // 실무 최적화: 검색어나 정렬 기준, 원본 데이터가 바뀔 때만 재계산 (useMemo)
  const filtered = useMemo(() => {
    return records
      .filter((record) => {
        const cardType = getReportCardType(record.intvStatus, record.report?.reportStatus)
        if (!cardType) return false

        // 검색어가 없으면 모두 보여줌
        if (!search) return true

        return record.title.toLowerCase().includes(search.toLowerCase())
      })
      .sort((a, b) => {
        // 2. 기존 score -> report.totalScore
        if (sortBy === 'score') {
          // 점수가 null이면 맨 밑으로 보내기 위해 -1 처리
          const scoreA = a.report?.totalScore ?? -1
          const scoreB = b.report?.totalScore ?? -1

          return scoreB - scoreA // 내림차순 (높은 점수 우선)
        }

        // 3. 기존 date -> updatedAt (최신순 정렬)
        // ISO 문자열("2026-03-10T09:00...")을 타임스탬프 숫자로 변환해서 비교
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      })
  }, [records, search, sortBy])

  return {
    search,
    setSearch,
    sortBy,
    setSortBy,
    filtered,
  }
}
