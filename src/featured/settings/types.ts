export interface NotificationSettings {
  notificationEnabled: boolean
}

export interface SettingsState extends NotificationSettings {
  setNotificationEnabled: (enabled: boolean) => void
}

export type ThemeValue = 'light' | 'dark' | 'system'

export interface ThemeOption {
  value: ThemeValue
  label: string
}
