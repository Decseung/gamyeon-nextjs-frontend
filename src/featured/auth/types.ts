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
  logout: () => void
}

export interface OAuthLoginData {
  accessToken: string
  refreshToken: string
  user: User
  restoreToken: string | null
  restorableUntil: string | null
}

export interface RestoreUser {
  restoreToken: string
  restorableUntil: string
  user: User
}
