import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User, AuthState } from './types'

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoggedIn: false,
      isSessionVerified: false,
      signin: (user: User) => {
        set({ user, isLoggedIn: true, isSessionVerified: true })
      },
      restoreSession: (user: User) => {
        set({ user, isLoggedIn: true, isSessionVerified: true })
      },
      updateNickname: (userId: number, nickname: string) => {
        let updated = false

        set((state) => {
          if (!state.isLoggedIn || !state.user || state.user.id !== userId) {
            return state
          }

          updated = true
          return {
            user: {
              ...state.user,
              nickname,
            },
          }
        })

        return updated
      },
      logout: () => {
        set({ user: null, isLoggedIn: false, isSessionVerified: false })
      },
    }),
    {
      name: 'ai-interview-user',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        user: state.user,
        isLoggedIn: state.isLoggedIn,
      }),
    },
  ),
)
