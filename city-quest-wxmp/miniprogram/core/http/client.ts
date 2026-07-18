/**
 * Unified wx.request + envelope unwrap.
 * Callers: feature infrastructure repositories only (not pages).
 */

import { apiUrl, assetUrl } from '../config/env'
import { HTTP_TIMEOUT_MS } from '../config/constants'
import type { SessionPort } from '../session/types'
import { HttpError } from './errors'
import type { ApiResponse } from './types'

/** Methods used by the miniprogram. No PATCH — WeChat typings omit it; writes use POST. */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

export interface RequestOptions {
  method?: HttpMethod
  data?: unknown
  /** Attach Bearer from session when true */
  auth?: boolean
  timeoutMs?: number
  /** Path relative to API host, e.g. /api/v1/public/encyclopedias */
  path: string
}

export interface HttpClient {
  request<T>(options: RequestOptions): Promise<T>
  requestAsset<T>(path: string): Promise<T>
}

export interface CreateHttpClientDeps {
  session: SessionPort
  onUnauthorized?: () => void
}

export function createHttpClient(deps: CreateHttpClientDeps): HttpClient {
  const { session, onUnauthorized } = deps

  function request<T>(options: RequestOptions): Promise<T> {
    const method = options.method ?? 'GET'
    const url = apiUrl(options.path)
    const header: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (options.auth) {
      const token = session.getToken()
      if (token) header.Authorization = `Bearer ${token}`
    }

    return new Promise<T>((resolve, reject) => {
      wx.request({
        url,
        method,
        data: options.data as
          | WechatMiniprogram.IAnyObject
          | string
          | ArrayBuffer
          | undefined,
        header,
        timeout: options.timeoutMs ?? HTTP_TIMEOUT_MS,
        success(res) {
          const status = res.statusCode
          const body = res.data as ApiResponse<T> | string | null

          if (typeof body !== 'object' || body === null || !('success' in body)) {
            reject(new HttpError(status, 'INTERNAL_ERROR', '响应格式无效'))
            return
          }

          if (status === 401 || body.error?.code === 'UNAUTHORIZED') {
            session.clear()
            onUnauthorized?.()
          }

          if (!body.success) {
            const code = body.error?.code ?? 'INTERNAL_ERROR'
            const message = body.error?.message ?? '请求失败'
            reject(new HttpError(status, code, message))
            return
          }

          resolve(body.data as T)
        },
        fail(err) {
          const msg = err.errMsg || '网络错误'
          const code = msg.includes('timeout') ? 'TIMEOUT' : 'NETWORK_ERROR'
          reject(new HttpError(0, code, msg))
        },
      })
    })
  }

  function requestAsset<T>(path: string): Promise<T> {
    const url = assetUrl(path)
    return new Promise<T>((resolve, reject) => {
      wx.request({
        url,
        method: 'GET',
        timeout: HTTP_TIMEOUT_MS,
        success(res) {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(res.data as T)
            return
          }
          reject(new HttpError(res.statusCode, 'INTERNAL_ERROR', '资源加载失败'))
        },
        fail(err) {
          reject(new HttpError(0, 'NETWORK_ERROR', err.errMsg || '网络错误'))
        },
      })
    })
  }

  return { request, requestAsset }
}
