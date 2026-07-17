/**
 * Multi-env API base URL.
 * Callers: core/http, composition root. Never ship secrets here.
 */

export type MiniProgramEnvVersion = 'develop' | 'trial' | 'release'

export interface AppEnv {
  /** e.g. https://api.example.com — no trailing slash */
  apiBaseUrl: string
  envVersion: MiniProgramEnvVersion
}

/**
 * Local develop default. Override before device testing.
 * Do NOT commit personal LAN IPs as the project default.
 */
const DEVELOP_API_BASE_URL = 'http://192.168.0.107:8787'

/** Set for trial/release builds (custom domain). */
const TRIAL_API_BASE_URL = 'https://api.example.com'
const RELEASE_API_BASE_URL = 'https://api.example.com'

function detectEnvVersion(): MiniProgramEnvVersion {
  try {
    const info = wx.getAccountInfoSync()
    const v = info.miniProgram.envVersion
    if (v === 'develop' || v === 'trial' || v === 'release') return v
  } catch {
    // non-wechat (unit tests)
  }
  return 'develop'
}

function baseUrlFor(version: MiniProgramEnvVersion): string {
  switch (version) {
    case 'trial':
      return TRIAL_API_BASE_URL.replace(/\/$/, '')
    case 'release':
      return RELEASE_API_BASE_URL.replace(/\/$/, '')
    case 'develop':
    default:
      return DEVELOP_API_BASE_URL.replace(/\/$/, '')
  }
}

let cached: AppEnv | null = null

export function getEnv(): AppEnv {
  if (cached) return cached
  const envVersion = detectEnvVersion()
  cached = {
    envVersion,
    apiBaseUrl: baseUrlFor(envVersion),
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
