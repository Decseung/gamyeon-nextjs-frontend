import type { ThemeOption } from './types'

export const SETTINGS_COPY = {
  pageTitle: '설정',
  pageDescription: '계정 정보와 서비스 환경을 관리하세요.',
  sectionAccount: '계정',
  sectionAccountDescription: '내 프로필 정보와 계정을 관리합니다.',
  sectionGeneral: '일반',
  sectionGeneralDescription: '화면과 알림 등 서비스 환경을 설정합니다.',
  profileTitle: '프로필',
  accountTitle: '계정 관리',
  appearanceTitle: '화면',
  notificationTitle: '알림',
  localOnlyNotice: '알림 설정은 현재 기기에만 저장됩니다.',
  withdrawPendingToast: '회원 탈퇴 기능은 준비 중입니다.',
} as const

export const THEME_OPTIONS: ThemeOption[] = [
  { value: 'light', label: '라이트' },
  { value: 'dark', label: '다크' },
]

export const SETTINGS_STORAGE_KEY = 'gamyeon-settings'
