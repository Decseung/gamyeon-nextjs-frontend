// ==========================================
// 1. API 응답 타입 (/api/v1/report/list)
// ==========================================
export interface ReportSummary {
  reportId: number
  reportStatus: 'SUCCEED' | 'IN_PROGRESS' | 'FAILED' | 'DELETED'
  totalScore: number | null
  answeredCount: number | null
  strengths: string[] | null
  weaknesses: string[] | null
}

export interface InterviewReportItem {
  intvId: number
  title: string
  intvStatus: 'READY' | 'FINISHED' | 'PAUSED' | 'IN_PROGRESS'
  durationSeconds: number | null
  createdAt: string
  updatedAt: string
  report: ReportSummary | null
}

// 리포트 목록 조회 API 최상위 응답 타입
export interface ReportListResponse {
  success: boolean
  code: string
  message: string
  data: InterviewReportItem[]
}

// ==========================================
// 2. UI 전용 타입 (정렬 등)
// ==========================================
export type SortBy = 'date' | 'score'
