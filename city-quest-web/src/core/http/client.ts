/**
 * Unified fetch + envelope unwrap.
 * Callers: feature infrastructure repositories only (not pages).
 */

import { apiUrl, assetUrl } from '../config/env'
import { HTTP_TIMEOUT_MS } from '../config/constants'
import type { SessionPort } from '../session/types'
import { HttpError } from './errors'
import type { ApiResponse } from './types'

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

export interface RequestOptions {
  method?: HttpMethod
  data?: unknown
  auth?: boolean
  timeoutMs?: number
  path: string
}

export interface HttpClient {
  request<T>(options: RequestOptions): Promise<T>
  requestAsset<T>(path: string): Promise<T>
  upload<T>(options: {
    path: string
    file: File | Blob
    fieldName?: string
    fileName?: string
    auth?: boolean
    timeoutMs?: number
  }): Promise<T>
}

export interface CreateHttpClientDeps {
  session: SessionPort
  onUnauthorized?: () => void
}

export function createHttpClient(deps: CreateHttpClientDeps): HttpClient {
  const { session, onUnauthorized } = deps

  async function request<T>(options: RequestOptions): Promise<T> {
    const method = options.method ?? 'GET'
    const url = apiUrl(options.path)
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (options.auth) {
      const token = session.getToken()
      if (token) headers.Authorization = `Bearer ${token}`
    }

    const controller = new AbortController()
    const timeoutMs = options.timeoutMs ?? HTTP_TIMEOUT_MS
    const timer = window.setTimeout(() => controller.abort(), timeoutMs)

    try {
      const res = await fetch(url, {
        method,
        headers,
        body:
          method === 'GET' || method === 'DELETE'
            ? undefined
            : options.data !== undefined
              ? JSON.stringify(options.data)
              : undefined,
        signal: controller.signal,
      })

      const status = res.status
      let body: ApiResponse<T> | null = null
      try {
        body = (await res.json()) as ApiResponse<T>
      } catch {
        throw new HttpError(status, 'INTERNAL_ERROR', '响应格式无效')
      }

      if (typeof body !== 'object' || body === null || !('success' in body)) {
        throw new HttpError(status, 'INTERNAL_ERROR', '响应格式无效')
      }

      if (status === 401 || body.error?.code === 'UNAUTHORIZED') {
        session.clear()
        onUnauthorized?.()
      }

      if (!body.success) {
        const code = body.error?.code ?? 'INTERNAL_ERROR'
        const message = body.error?.message ?? '请求失败'
        throw new HttpError(status, code, message)
      }

      return body.data as T
    } catch (e) {
      if (e instanceof HttpError) throw e
      if (e instanceof DOMException && e.name === 'AbortError') {
        throw new HttpError(0, 'TIMEOUT', '请求超时，请重试')
      }
      const msg = e instanceof Error ? e.message : '网络错误'
      throw new HttpError(0, 'NETWORK_ERROR', msg)
    } finally {
      window.clearTimeout(timer)
    }
  }

  async function requestAsset<T>(path: string): Promise<T> {
    const url = assetUrl(path)
    const controller = new AbortController()
    const timer = window.setTimeout(() => controller.abort(), HTTP_TIMEOUT_MS)
    try {
      const res = await fetch(url, { method: 'GET', signal: controller.signal })
      if (res.status >= 200 && res.status < 300) {
        return (await res.json()) as T
      }
      throw new HttpError(res.status, 'INTERNAL_ERROR', '资源加载失败')
    } catch (e) {
      if (e instanceof HttpError) throw e
      if (e instanceof DOMException && e.name === 'AbortError') {
        throw new HttpError(0, 'TIMEOUT', '请求超时，请重试')
      }
      const msg = e instanceof Error ? e.message : '网络错误'
      throw new HttpError(0, 'NETWORK_ERROR', msg)
    } finally {
      window.clearTimeout(timer)
    }
  }

  async function upload<T>(options: {
    path: string
    file: File | Blob
    fieldName?: string
    fileName?: string
    auth?: boolean
    timeoutMs?: number
  }): Promise<T> {
    const url = apiUrl(options.path)
    const headers: Record<string, string> = {}
    if (options.auth !== false) {
      const token = session.getToken()
      if (token) headers.Authorization = `Bearer ${token}`
    }

    const form = new FormData()
    const fieldName = options.fieldName ?? 'file'
    if (options.fileName) {
      form.append(fieldName, options.file, options.fileName)
    } else {
      form.append(fieldName, options.file)
    }

    const controller = new AbortController()
    const timeoutMs = options.timeoutMs ?? HTTP_TIMEOUT_MS
    const timer = window.setTimeout(() => controller.abort(), timeoutMs)

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: form,
        signal: controller.signal,
      })
      const status = res.status
      let body: ApiResponse<T> | null = null
      try {
        body = (await res.json()) as ApiResponse<T>
      } catch {
        throw new HttpError(status, 'INTERNAL_ERROR', '响应格式无效')
      }

      if (typeof body !== 'object' || body === null || !('success' in body)) {
        throw new HttpError(status, 'INTERNAL_ERROR', '响应格式无效')
      }

      if (status === 401 || body.error?.code === 'UNAUTHORIZED') {
        session.clear()
        onUnauthorized?.()
      }

      if (!body.success) {
        const code = body.error?.code ?? 'INTERNAL_ERROR'
        const message = body.error?.message ?? '上传失败'
        throw new HttpError(status, code, message)
      }

      return body.data as T
    } catch (e) {
      if (e instanceof HttpError) throw e
      if (e instanceof DOMException && e.name === 'AbortError') {
        throw new HttpError(0, 'TIMEOUT', '请求超时，请重试')
      }
      const msg = e instanceof Error ? e.message : '网络错误'
      throw new HttpError(0, 'NETWORK_ERROR', msg)
    } finally {
      window.clearTimeout(timer)
    }
  }

  return { request, requestAsset, upload }
}
