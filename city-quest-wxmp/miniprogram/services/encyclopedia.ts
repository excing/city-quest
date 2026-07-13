/**
 * Callers: pages/map, pages/detail.
 * API: GET /public/types, /public/encyclopedias, /public/encyclopedias/:id
 * User: 阅读 @docs , 然后选择合适的agents或skills, 开始进行开发.
 */
import { request } from './http'

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

export function fetchTypes(): Promise<EncyclopediaType[]> {
  return request<EncyclopediaType[]>('/public/types', { auth: false })
}

export function fetchPublishedList(): Promise<EncyclopediaMapItem[]> {
  return request<EncyclopediaMapItem[]>('/public/encyclopedias', { auth: false })
}

export function fetchDetail(id: string): Promise<EncyclopediaDetail> {
  return request<EncyclopediaDetail>(`/public/encyclopedias/${id}`)
}
