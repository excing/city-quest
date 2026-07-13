/**
 * Callers: encyclopedia/auth/favorite services.
 * API: all wx.request to Worker envelope {success,data,error,meta}.
 * User: 阅读 @docs , 然后选择合适的agents或skills, 开始进行开发.
 */
import { apiUrl } from '../config/env'
import { getToken } from '../storage/token'

export interface ApiErrorBody {
  code: string
  message: string
  details?: unknown
}

export interface ApiResponse<T> {
  success: boolean
  data: T | null
  error: ApiErrorBody | null
  meta: Record<string, unknown> | null
}

export class HttpError extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.name = 'HttpError'
    this.status = status
    this.code = code
  }
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  data?: WechatMiniprogram.IAnyObject | string | ArrayBuffer
  auth?: boolean
  header?: Record<string, string>
}

export function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const method = options.method ?? 'GET'
  const header: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.header ?? {}),
  }

  if (options.auth !== false) {
    const token = getToken()
    if (token) {
      header.Authorization = `Bearer ${token}`
    }
  }

  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl(path),
      method,
      data: options.data,
      header,
      success: (res) => {
        const status = res.statusCode
        const body = res.data as ApiResponse<T> | undefined

        if (!body || typeof body !== 'object' || !('success' in body)) {
          reject(new HttpError(status, 'INTERNAL_ERROR', '服务响应异常'))
          return
        }

        if (body.success && body.data !== undefined && body.data !== null) {
          resolve(body.data)
          return
        }

        if (body.success && body.data === null) {
          resolve(body.data as T)
          return
        }

        const code = body.error?.code ?? 'INTERNAL_ERROR'
        const message = body.error?.message ?? '请求失败'
        reject(new HttpError(status, code, message))
      },
      fail: () => {
        reject(new HttpError(0, 'NETWORK_ERROR', '网络异常，请检查网络后重试'))
      },
    })
  })
}
