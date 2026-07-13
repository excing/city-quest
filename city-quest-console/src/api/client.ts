/**
 * Callers: stores/views. API: /api/v1/admin/* envelope.
 * User: 开始阶段B 和 C, 完成产品闭环.
 */

const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ||
  'http://127.0.0.1:8787'

export interface ApiErrorBody {
  code: string
  message: string
}

export interface ApiResponse<T> {
  success: boolean
  data: T | null
  error: ApiErrorBody | null
  meta: { total?: number; page?: number; pageSize?: number } | null
}

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  constructor(status: number, code: string, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

export interface EncyclopediaType {
  key: string
  name: string
  color: string
}

export interface AdminEncyclopedia {
  id: string
  name: string
  typeKey: string
  lng: number
  lat: number
  intro: string
  address: string | null
  businessHours: string | null
  avgPrice: string | null
  phone: string | null
  tags: string[]
  images: string[]
  imageUrls: string[]
  coverUrl: string | null
  status: string
  createdAt: string
  updatedAt: string
}

export type EncyclopediaInput = {
  name: string
  typeKey: string
  lng: number
  lat: number
  intro: string
  address?: string | null
  businessHours?: string | null
  avgPrice?: string | null
  phone?: string | null
  tags?: string[]
  images?: string[]
  status?: 'published' | 'unpublished'
}

function authHeader(token: string | null): HeadersInit {
  if (!token) return { 'Content-Type': 'application/json' }
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }
}

async function parseJson<T>(res: Response): Promise<T> {
  const body = (await res.json()) as ApiResponse<T>
  if (!body || typeof body !== 'object') {
    throw new ApiError(res.status, 'INTERNAL_ERROR', '服务响应异常')
  }
  if (body.success) return body.data as T
  throw new ApiError(
    res.status,
    body.error?.code ?? 'INTERNAL_ERROR',
    body.error?.message ?? '请求失败',
  )
}

export async function adminLogin(username: string, password: string) {
  const res = await fetch(`${API_BASE}/api/v1/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  return parseJson<{ token: string }>(res)
}

/**
 * Prefer Workers static asset (does not count against Worker invocations).
 * Falls back to admin API when asset is unavailable.
 */
export async function fetchAdminTypes(token: string): Promise<EncyclopediaType[]> {
  try {
    const assetRes = await fetch(`${API_BASE}/config/encyclopedia-types.json`)
    if (assetRes.ok) {
      const data = (await assetRes.json()) as unknown
      if (Array.isArray(data) && data.length > 0) {
        return data as EncyclopediaType[]
      }
    }
  } catch {
    // fall through to API
  }

  const res = await fetch(`${API_BASE}/api/v1/admin/types`, {
    headers: authHeader(token),
  })
  return parseJson<EncyclopediaType[]>(res)
}

export async function fetchAdminEncyclopedias(
  token: string,
  params: { page?: number; pageSize?: number; status?: string } = {},
) {
  const q = new URLSearchParams()
  if (params.page) q.set('page', String(params.page))
  if (params.pageSize) q.set('pageSize', String(params.pageSize))
  if (params.status) q.set('status', params.status)
  const res = await fetch(`${API_BASE}/api/v1/admin/encyclopedias?${q}`, {
    headers: authHeader(token),
  })
  const body = (await res.json()) as ApiResponse<AdminEncyclopedia[]>
  if (!body.success) {
    throw new ApiError(
      res.status,
      body.error?.code ?? 'INTERNAL_ERROR',
      body.error?.message ?? '请求失败',
    )
  }
  return {
    items: body.data ?? [],
    total: body.meta?.total ?? 0,
    page: body.meta?.page ?? 1,
    pageSize: body.meta?.pageSize ?? 20,
  }
}

export async function fetchAdminEncyclopedia(token: string, id: string) {
  const res = await fetch(`${API_BASE}/api/v1/admin/encyclopedias/${id}`, {
    headers: authHeader(token),
  })
  return parseJson<AdminEncyclopedia>(res)
}

export async function createEncyclopedia(token: string, input: EncyclopediaInput) {
  const res = await fetch(`${API_BASE}/api/v1/admin/encyclopedias`, {
    method: 'POST',
    headers: authHeader(token),
    body: JSON.stringify(input),
  })
  return parseJson<AdminEncyclopedia>(res)
}

export async function updateEncyclopedia(
  token: string,
  id: string,
  input: Partial<EncyclopediaInput>,
) {
  const res = await fetch(`${API_BASE}/api/v1/admin/encyclopedias/${id}`, {
    method: 'PATCH',
    headers: authHeader(token),
    body: JSON.stringify(input),
  })
  return parseJson<AdminEncyclopedia>(res)
}

export async function deleteEncyclopedia(token: string, id: string) {
  const res = await fetch(`${API_BASE}/api/v1/admin/encyclopedias/${id}`, {
    method: 'DELETE',
    headers: authHeader(token),
  })
  return parseJson<{ id: string }>(res)
}

export async function uploadImage(token: string, file: File) {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${API_BASE}/api/v1/admin/uploads`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  })
  return parseJson<{ key: string; url: string }>(res)
}
