/**
 * Callers: pages/map, pages/detail.
 * API: static /config/encyclopedia-types.json; GET /public/encyclopedias, /public/encyclopedias/:id
 * User: 阅读 @docs , 然后选择合适的agents或skills, 开始进行开发.
 */
import { assetUrl } from '../config/env'
import { HttpError, request } from './http'

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
export function fetchTypes(): Promise<EncyclopediaType[]> {
  return new Promise((resolve, reject) => {
    wx.request({
      url: assetUrl('/config/encyclopedia-types.json'),
      method: 'GET',
      success: (res) => {
        const data = res.data
        if (
          res.statusCode >= 200 &&
          res.statusCode < 300 &&
          Array.isArray(data) &&
          data.length > 0
        ) {
          resolve(data as EncyclopediaType[])
          return
        }
        reject(
          new HttpError(
            res.statusCode || 0,
            'INTERNAL_ERROR',
            '类型配置加载失败',
          ),
        )
      },
      fail: () => {
        reject(new HttpError(0, 'NETWORK_ERROR', '网络异常，请检查网络后重试'))
      },
    })
  })
}

export function fetchPublishedList(): Promise<EncyclopediaMapItem[]> {
  return request<EncyclopediaMapItem[]>('/public/encyclopedias', { auth: false })
}

export function fetchDetail(id: string): Promise<EncyclopediaDetail> {
  return request<EncyclopediaDetail>(`/public/encyclopedias/${id}`)
}
