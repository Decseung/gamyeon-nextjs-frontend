import { isRedirectError } from 'next/dist/client/components/redirect-error'
import { NoticeHeader } from '@/featured/notice/components/NoticeHeader'
import { NoticeClient } from '@/featured/notice/components/NoticeClient'
import type { Notice } from '@/featured/notice/types'
import { getNoticesAction } from '@/featured/notice/actions/notice.action'

export default async function NoticePage() {
  let fetchedNotices: Notice[] = []
  try {
    const result = await getNoticesAction()

    if (result.success && result.data) {
      fetchedNotices = result.data
    }
  } catch (error) {
    if (isRedirectError(error)) throw error
    console.error('공지사항 전체 페이지 불러오기 실패:', error)
  }

  return (
    <>
      <NoticeHeader />
      <NoticeClient initialNotices={fetchedNotices} />
    </>
  )
}
