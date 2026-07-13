/**
 * Callers: detail, favorites page.
 * API: GET/POST/DELETE /me/favorites
 * User: 开始阶段B 和 C, 完成产品闭环.
 */
import { request } from './http'

export interface FavoriteItem {
  encyclopediaId: string
  name: string
  typeKey: string
  intro: string
  status: 'published' | 'unpublished' | string
  coverUrl: string | null
  favoritedAt: string
}

export function fetchFavorites(): Promise<FavoriteItem[]> {
  return request<FavoriteItem[]>('/me/favorites', { auth: true })
}

export function addFavorite(encyclopediaId: string): Promise<{
  encyclopediaId: string
  favorited: boolean
}> {
  return request('/me/favorites', {
    method: 'POST',
    auth: true,
    data: { encyclopediaId },
  })
}

export function removeFavorite(encyclopediaId: string): Promise<{
  encyclopediaId: string
  favorited: boolean
}> {
  return request(`/me/favorites/${encyclopediaId}`, {
    method: 'DELETE',
    auth: true,
  })
}
