export interface User {
  id: number
  email: string
  nickname: string
  provider: string
  status: string
  createdAt: string
  name?: string
  avatar?: string
}

export interface AuthState {
  user: User | null
  isLoggedIn: boolean
  isSessionVerified: boolean
  signin: (user: User) => void
  restoreSession: (user: User) => void
  updateNickname: (userId: number, nickname: string) => boolean
  logout: () => void
}

export type OAuthLoginData =
  | {
      user: User
      restoreRequired: false
      restorableUntil: null
    }
  | {
      user: User | null
      restoreRequired: true
      restorableUntil: string | null
    }

export interface RestoreUser {
  restorableUntil: string | null
  user: User | null
}

export interface RestoreAccountData {
  user: User
}
