'use client'

import type { Notice } from '@/featured/notice/types'
import { useNoticeFilter } from '@/featured/notice/hooks/useNoticeFilter'
import { NoticeFilters } from '@/featured/notice/components/NoticeFilters'
import { NoticeList } from '@/featured/notice/components/NoticeList'
import { PageContainer } from '@/shared/components/PageContainer'

interface NoticeClientProps {
  initialNotices: Notice[]
}

export function NoticeClient({ initialNotices }: NoticeClientProps) {
  const { search, setSearch, category, setCategory, notices } = useNoticeFilter(initialNotices)

  return (
    <PageContainer className="py-6">
      <NoticeFilters
        search={search}
        onSearchChange={setSearch}
        category={category}
        onCategoryChange={setCategory}
      />
      <NoticeList notices={notices} search={search} />
    </PageContainer>
  )
}
