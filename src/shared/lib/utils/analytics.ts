import { sendGAEvent } from '@next/third-parties/google'

// 기획 단계에서 정의한 이벤트 명세
type FunnelStep =
  // 1. AI 대기 및 리포트 관련 이벤트들
  | 'question_gen_start' // 질문 생성 시작
  | 'question_gen_complete' // 질문 생성 완료
  | 'report_gen_start' // 리포트 생성 시작
  | 'report_gen_complete' // 리포트 생성 완료 (여기 있던 세미콜론 제거)

  // 2. 파일 업로드 플로우
  | 'enter_upload_page' // 파일 업로드 페이지 진입
  | 'upload_s3_success' // S3 업로드 성공
  | 'upload_s3_error' // S3 업로드 실패 (여기 있던 세미콜론 제거)

  // 3. 디바이스 권한 및 면접 시작 (누락되었던 granted 추가!)
  | 'mic_permission_granted' // 마이크 권한 허용
  | 'mic_permission_denied' // 마이크 권한 거부
  | 'cam_permission_granted' // 카메라 권한 허용
  | 'cam_permission_denied' // 카메라 권한 거부
  | 'start_interview' // 면접 시작 완료 (맨 마지막에만 세미콜론!)

type EventParams = Record<string, string | number | boolean>

// string 대신 FunnelStep 타입을 적용
export const trackEvent = (eventName: FunnelStep | string, params?: EventParams) => {
  sendGAEvent('event', eventName, params || {})
}

// 퍼널 함수에는 더 엄격하게 FunnelStep 타입만 허용
export const trackFunnel = (stepName: FunnelStep) => {
  trackEvent(stepName, { category: 'funnel' })
}
