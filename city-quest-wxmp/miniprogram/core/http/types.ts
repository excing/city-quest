/**
 * API envelope — aligned with city-quest-server envelope.
 * Callers: core/http, feature repositories.
 */

export type ApiErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'WECHAT_LOGIN_FAILED'
  | 'CONFLICT'
  | 'INTERNAL_ERROR'
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | string

export interface ApiErrorBody {
  code: ApiErrorCode
  message: string
  details?: unknown
}

export interface ApiMeta {
  total?: number
  page?: number
  pageSize?: number
  [key: string]: unknown
}

export interface ApiResponse<T> {
  success: boolean
  data: T | null
  error: ApiErrorBody | null
  meta: ApiMeta | null
}
