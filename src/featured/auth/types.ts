export interface User {
  id?: number
  email: string
  nickname: string
  name?: string
  avatar?: string
  provider?: string
  status?: string
}

export interface AuthState {
  user: User | null
  isLoggedIn: boolean
  signin: (user: User) => void
  logout: () => void
}

export interface OAuthLoginData {
  accessToken: string
  refreshToken: string
  user: User
}
