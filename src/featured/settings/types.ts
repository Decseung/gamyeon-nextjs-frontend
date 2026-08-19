export interface NotificationSettings {
  notificationEnabled: boolean
}

export interface SettingsState extends NotificationSettings {
  setNotificationEnabled: (enabled: boolean) => void
}

export type ThemeValue = 'light' | 'dark'

export interface ThemeOption {
  value: ThemeValue
  label: string
}

export interface UpdateNicknameRequest {
  nickname: string
}

export interface NicknameUpdateData {
  id: number
  nickname: string
}
