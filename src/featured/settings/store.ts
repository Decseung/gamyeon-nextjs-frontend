import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { SETTINGS_STORAGE_KEY } from './constants'
import type { SettingsState } from './types'

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      notificationEnabled: true,
      setNotificationEnabled: (enabled: boolean) => set({ notificationEnabled: enabled }),
    }),
    {
      name: SETTINGS_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
