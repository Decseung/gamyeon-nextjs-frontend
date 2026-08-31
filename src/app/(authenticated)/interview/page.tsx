import { Suspense } from 'react'
import { InterviewLayout } from '@/featured/interview/components/InterviewLayout'
import { InterviewViewportGuard } from '@/featured/interview/components/InterviewViewportGuard'

export default function InterviewPage() {
  return (
    <Suspense>
      <InterviewViewportGuard>
        <InterviewLayout />
      </InterviewViewportGuard>
    </Suspense>
  )
}
