const LEFT_EYE = [33, 160, 158, 133, 153, 144]
const RIGHT_EYE = [362, 385, 387, 263, 373, 380]

// EAR 임계값 및 깜빡임 감지 상수
const EAR_THRESHOLD = 0.22
const BLINK_MIN_FRAMES = 2 // EAR이 threshold 아래로 유지돼야 할 최소 연속 프레임 (50ms × 2 = 100ms)
const BLINK_MAX_MS = 400 // 이 시간 초과 시 깜빡임 아닌 눈 감음으로 판단
const EAR_HISTORY_SIZE = 3 // EAR 롤링 평균 윈도우 크기

// 시선 방향 판단 임계값 (정규화 기준)
const YAW_THRESHOLD = 15 // 좌우 이탈 기준 (°)
const PITCH_THRESHOLD = 12 // 상하 이탈 기준 (°)

const TOTAL_THINK_TIME = 10
const TOTAL_ANSWER_TIME = 60

export const ALIGN_THRESHOLD = 8 // 정면 판정 각도 기준 (8도 이내면 정면)
export const ALIGN_DURATION_MS = 3000 // 3초 유지 필요

const QUESTIONS = [
  '자기소개를 부탁드립니다. 본인의 핵심 역량과 지원 동기를 중심으로 말씀해주세요.',
  '이전 프로젝트에서 가장 어려웠던 기술적 도전은 무엇이었고, 어떻게 해결하셨나요?',
  '팀 내에서 의견 충돌이 발생했을 때 어떻게 대처하시나요? 구체적인 경험을 말씀해주세요.',
  '5년 후 본인의 커리어 목표는 무엇인가요?',
  '마지막으로 저희에게 하고 싶은 질문이 있으신가요?',
] as const

const QUESTION_LOADING_TEXTS = [
  'AI가 맞춤 면접 질문을 준비하고 있습니다.',
  '이력서를 꼼꼼히 분석하고 있습니다.',
  '질문을 생성하고 있습니다.',
  '조금만 더 기다려주세요.',
] as const

export {
  LEFT_EYE,
  RIGHT_EYE,
  EAR_THRESHOLD,
  BLINK_MIN_FRAMES,
  BLINK_MAX_MS,
  EAR_HISTORY_SIZE,
  YAW_THRESHOLD,
  PITCH_THRESHOLD,
  TOTAL_THINK_TIME,
  TOTAL_ANSWER_TIME,
  QUESTIONS,
  QUESTION_LOADING_TEXTS,
}
