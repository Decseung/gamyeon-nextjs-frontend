/** 필드 유효성 에러 */
export interface ApiFieldError {
  field: string
  reason: string
}

/** 네트워크 단절/요청 실패 에러 */
export class NetworkError extends Error {
  constructor(message = '네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.') {
    super(message)
    this.name = 'NetworkError'
  }
}

/** 서버 공통 응답 래퍼 */
export interface ApiResponse<T> {
  success: boolean
  code: string
  message: string
  data: T | null
  errors?: ApiFieldError[] | null
  httpStatus?: number
}

export interface RequestConfig {
  params?: Record<string, string | number | boolean>
  headers?: Record<string, string>
  cache?: RequestCache
  next?: NextFetchRequestConfig
}

export interface PaginatedResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}
