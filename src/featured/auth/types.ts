export interface User {
  id: number
  email: string
  nickname: string
  provider: string
  status: string
  createdAt: string
  // Kept for compatibility with OAuth providers that include profile metadata.
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

export interface OAuthLoginData {
  accessToken: string
  refreshToken: string
  user: User
}
