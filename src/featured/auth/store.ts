import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User, AuthState } from './types'

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoggedIn: false,
      signin: (user: User) => {
        set({ user, isLoggedIn: true })
      },
      logout: () => {
        set({ user: null, isLoggedIn: false })
      },
    }),
    {
      name: 'ai-interview-user',
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
)
