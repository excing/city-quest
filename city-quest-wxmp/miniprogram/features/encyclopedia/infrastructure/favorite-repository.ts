/**
 * HTTP favorites repository.
 * Callers: composition → application (auth required).
 */

import type { HttpClient } from '../../../core/http/client'
import type { FavoriteListItem } from '../domain/entities'
import type { FavoriteRepository } from '../domain/ports'

export function createFavoriteRepository(http: HttpClient): FavoriteRepository {
  return {
    async list(): Promise<FavoriteListItem[]> {
      const data = await http.request<FavoriteListItem[]>({
        path: '/api/v1/me/favorites',
        method: 'GET',
        auth: true,
      })
      return data ?? []
    },
    async add(encyclopediaId: string): Promise<void> {
      await http.request<unknown>({
        path: '/api/v1/me/favorites',
        method: 'POST',
        auth: true,
        data: { encyclopediaId },
      })
    },
    async remove(encyclopediaId: string): Promise<void> {
      await http.request<unknown>({
        path: `/api/v1/me/favorites/${encyclopediaId}`,
        method: 'DELETE',
        auth: true,
      })
    },
  }
}
