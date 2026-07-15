/**
 * Map API codes to user-facing copy. No toast side effects.
 * Callers: presentation layers.
 */

import type { ApiErrorCode } from '../http/types'
import { HttpError, isHttpError } from '../http/errors'

const TABLE: Record<string, string> = {
  UNAUTHORIZED: '请先登录',
  FORBIDDEN: '没有权限',
  NOT_FOUND: '该地点已下架，暂时无法查看',
  VALIDATION_ERROR: '参数有误',
  WECHAT_LOGIN_FAILED: '登录失败，请重试',
  CONFLICT: '操作冲突，请重试',
  INTERNAL_ERROR: '服务异常，请稍后重试',
  NETWORK_ERROR: '网络异常，请检查网络后重试',
  TIMEOUT: '请求超时，请重试',
}

export function messageForCode(code: ApiErrorCode): string {
  return TABLE[code] ?? '出错了，请稍后重试'
}

export function messageFromUnknown(error: unknown): string {
  if (isHttpError(error)) return error.message || messageForCode(error.code)
  if (error instanceof Error && error.message) return error.message
  return messageForCode('INTERNAL_ERROR')
}

export { HttpError, isHttpError }
