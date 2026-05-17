import { sendGAEvent } from '@next/third-parties/google'

// 기획 단계에서 정의한 이벤트 명세
type FunnelStep = 
  | 'enter_upload_page' 
  | 'upload_s3_success' 
  | 'upload_s3_error'
  | 'mic_permission_denied'
  | 'cam_permission_denied'
  | 'start_interview';

type EventParams = Record<string, string | number | boolean>;

// string 대신 FunnelStep 타입을 적용
export const trackEvent = (eventName: FunnelStep | string, params?: EventParams) => {
  sendGAEvent('event', eventName, params || {});
}

// 퍼널 함수에는 더 엄격하게 FunnelStep 타입만 허용
export const trackFunnel = (stepName: FunnelStep) => {
  trackEvent(stepName, { category: 'funnel' });
}