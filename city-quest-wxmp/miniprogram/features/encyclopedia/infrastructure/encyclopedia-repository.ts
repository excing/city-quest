/**
 * HTTP encyclopedia repository.
 * Callers: composition root → application.
 */

import type { HttpClient } from '../../../core/http/client'
import type {
  EncyclopediaDetail,
  EncyclopediaListItem,
  EncyclopediaType,
} from '../domain/entities'
import type { EncyclopediaRepository } from '../domain/ports'
import { FALLBACK_ENCYCLOPEDIA_TYPES } from './types-fallback'

export function createEncyclopediaRepository(http: HttpClient): EncyclopediaRepository {
  return {
    async listPublished(): Promise<EncyclopediaListItem[]> {
      const data = await http.request<EncyclopediaListItem[]>({
        path: '/api/v1/public/encyclopedias',
        method: 'GET',
      })
      return data ?? []
    },

    async getById(id: string): Promise<EncyclopediaDetail> {
      return http.request<EncyclopediaDetail>({
        path: `/api/v1/public/encyclopedias/${id}`,
        method: 'GET',
        auth: true,
      })
    },

    async listTypes(): Promise<EncyclopediaType[]> {
      try {
        const data = await http.requestAsset<EncyclopediaType[]>(
          '/config/encyclopedia-types.json',
        )
        if (Array.isArray(data) && data.length > 0) return data
      } catch {
        // fallback below
      }
      return FALLBACK_ENCYCLOPEDIA_TYPES.map((t) => ({ ...t }))
    },
  }
}
