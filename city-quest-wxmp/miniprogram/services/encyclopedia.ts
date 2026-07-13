/**
 * Callers: pages/map, pages/detail.
 * API: static /config/encyclopedia-types.json; GET /public/encyclopedias, /public/encyclopedias/:id
 * User: 阅读 @docs , 然后选择合适的agents或skills, 开始进行开发.
 */
import { HttpError, request, requestAsset } from './http'

export interface EncyclopediaType {
  key: string
  name: string
  color: string
}

export interface EncyclopediaMapItem {
  id: string
  name: string
  typeKey: string
  lng: number
  lat: number
  intro: string
}

export interface EncyclopediaDetail {
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
  coverUrl: string | null
  status: string
  isFavorited?: boolean
  createdAt: string
  updatedAt: string
}

/** Load types from Workers static asset (does not count against Worker invocations). */
export async function fetchTypes(): Promise<EncyclopediaType[]> {
  const data = await requestAsset<EncyclopediaType[]>('/config/encyclopedia-types.json')
  if (!Array.isArray(data) || data.length === 0) {
    throw new HttpError(0, 'INTERNAL_ERROR', '类型配置加载失败')
  }
  return data
}

export function fetchPublishedList(): Promise<EncyclopediaMapItem[]> {
  return request<EncyclopediaMapItem[]>('/public/encyclopedias', { auth: false })
}

export function fetchDetail(id: string): Promise<EncyclopediaDetail> {
  return request<EncyclopediaDetail>(`/public/encyclopedias/${id}`)
}
