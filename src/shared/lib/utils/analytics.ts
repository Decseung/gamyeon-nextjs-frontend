import { sendGAEvent } from '@next/third-parties/google'

// 기획 단계에서 정의한 이벤트 명세
type FunnelStep =
  // 1. AI 대기 및 리포트 관련 이벤트들
  | 'question_gen_start' // 질문 생성 시작
  | 'question_gen_complete' // 질문 생성 완료
  | 'report_gen_start' // 리포트 생성 시작
  | 'report_gen_complete' // 리포트 생성 완료
  | 'loading_tab_leave' // 리포트 발행 로딩 중 탭 이탈

  // 2. 파일 업로드 및 면접 시작 플로우 점검
  | 'open_interview_modal' // 모달창 최초 진입 (1단계)
  | 'complete_title_input' // 면접 제목 입력 후 확인
  | 'enter_upload_step' // 파일 업로드 단계 진입 (2단계)
  | 'upload_s3_success' // S3 업로드 성공
  | 'upload_s3_error' // S3 업로드 실패
  | 'request_cam_permission' // 카메라 권한 요청 시작 (3단계)
  | 'cam_permission_granted' // 카메라 권한 허용
  | 'cam_permission_denied' // 카메라 권한 거부
  | 'request_mic_permission' // 마이크 권한 요청 시작 (4단계)
  | 'mic_permission_granted' // 마이크 권한 허용
  | 'mic_permission_denied' // 마이크 권한 거부
  | 'start_interview' // 면접 시작 버튼 클릭

type EventParams = Record<string, string | number | boolean>

// string 대신 FunnelStep 타입을 적용
export const trackEvent = (eventName: FunnelStep | string, params?: EventParams) => {
  sendGAEvent('event', eventName, params || {})
}

// 퍼널 함수에는 더 엄격하게 FunnelStep 타입만 허용
export const trackFunnel = (stepName: FunnelStep) => {
  trackEvent(stepName, { category: 'funnel' })
}
