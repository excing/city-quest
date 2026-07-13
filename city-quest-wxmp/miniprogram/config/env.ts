/**
 * Callers: services/http.ts, app bootstrap.
 * API: client base URL for Worker. Schema: none.
 * User: 阅读 @docs , 然后选择合适的agents或skills, 开始进行开发.
 */

/** API base without trailing path; must be request 合法域名 in prod */
export const API_BASE_URL = 'http://192.168.0.107:8787'

export const API_PREFIX = '/api/v1'

export function apiUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${API_BASE_URL}${API_PREFIX}${normalized}`
}
