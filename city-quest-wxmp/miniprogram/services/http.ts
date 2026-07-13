/**
 * Callers: encyclopedia/auth/favorite services.
 * API: Worker envelope {success,data,error,meta}; static assets via requestAsset.
 * User: 阅读 @docs , 然后选择合适的agents或skills, 开始进行开发.
 */
import { apiUrl, assetUrl } from '../config/env'
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

export interface AssetRequestOptions {
  header?: Record<string, string>
}

/** Worker API under /api/v1; parses envelope {success,data,error,meta}. */
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

/**
 * Workers static assets (not Worker invocations), e.g. /config/encyclopedia-types.json.
 * Returns raw JSON body (no API envelope).
 */
export function requestAsset<T>(path: string, options: AssetRequestOptions = {}): Promise<T> {
  return new Promise((resolve, reject) => {
    wx.request({
      url: assetUrl(path),
      method: 'GET',
      header: {
        ...(options.header ?? {}),
      },
      success: (res) => {
        const status = res.statusCode
        if (status >= 200 && status < 300 && res.data !== undefined && res.data !== null) {
          resolve(res.data as T)
          return
        }
        reject(new HttpError(status || 0, 'INTERNAL_ERROR', '静态资源加载失败'))
      },
      fail: () => {
        reject(new HttpError(0, 'NETWORK_ERROR', '网络异常，请检查网络后重试'))
      },
    })
  })
}
