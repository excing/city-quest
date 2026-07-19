/**
 * Transport / API errors. UI maps code → toast; no toast here.
 * Callers: core/http, application layers.
 */

import type { ApiErrorCode } from './types'

export class HttpError extends Error {
  readonly status: number
  readonly code: ApiErrorCode

  constructor(status: number, code: ApiErrorCode, message: string) {
    super(message)
    this.name = 'HttpError'
    this.status = status
    this.code = code
  }
}

export function isHttpError(e: unknown): e is HttpError {
  return e instanceof HttpError
}
