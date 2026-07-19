/**
 * Multi-env API base URL.
 * Callers: core/http, composition root. Never ship secrets here.
 */

export interface AppEnv {
  /** e.g. https://api.example.com — no trailing slash; empty = same origin */
  apiBaseUrl: string
  mode: string
}

let cached: AppEnv | null = null

export function getEnv(): AppEnv {
  if (cached) return cached
  const raw = (import.meta.env.VITE_API_BASE_URL ?? '').trim()
  cached = {
    mode: import.meta.env.MODE,
    apiBaseUrl: raw.replace(/\/$/, ''),
  }
  return cached
}

/** Test helper — reset cache. */
export function resetEnvCacheForTests(): void {
  cached = null
}

export function apiUrl(path: string): string {
  const base = getEnv().apiBaseUrl
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  const p = path.startsWith('/') ? path : `/${path}`
  if (!base) return p
  return `${base}${p}`
}

/** Static assets on same origin (Workers Assets), e.g. /config/... */
export function assetUrl(path: string): string {
  return apiUrl(path)
}

/** Resolve encyclopedia media key to the public files API URL. */
export function fileUrl(key: string | null | undefined): string {
  if (!key) return ''
  const path = key.startsWith('/') ? key.slice(1) : key
  return apiUrl(`/api/v1/files/${path}`)
}
