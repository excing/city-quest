import type { HttpClient } from '../../../core/http/client'
import type {
  EncyclopediaDetail,
  EncyclopediaListItem,
  EncyclopediaType,
} from '../domain/entities'
import type { EncyclopediaRepository } from '../domain/ports'
import { normalizePublishedList } from '../domain/rules/normalize-list'
import { FALLBACK_ENCYCLOPEDIA_TYPES } from './types-fallback'

function normalizeTypes(raw: unknown): EncyclopediaType[] {
  if (!Array.isArray(raw)) return []
  const out: EncyclopediaType[] = []
  for (const row of raw) {
    if (row === null || typeof row !== 'object') continue
    const t = row as Record<string, unknown>
    if (
      typeof t.key !== 'string' ||
      !t.key.trim() ||
      typeof t.name !== 'string' ||
      !t.name.trim() ||
      typeof t.color !== 'string' ||
      !t.color.trim()
    ) {
      continue
    }
    out.push({
      key: t.key.trim(),
      name: t.name.trim(),
      color: t.color.trim(),
    })
  }
  return out
}

export function createEncyclopediaRepository(
  http: HttpClient,
): EncyclopediaRepository {
  return {
    async listPublished(): Promise<EncyclopediaListItem[]> {
      const data = await http.request<unknown>({
        path: '/api/v1/public/encyclopedias',
        method: 'GET',
      })
      return normalizePublishedList(data ?? [])
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
        const data = await http.requestAsset<unknown>(
          '/config/encyclopedia-types.json',
        )
        const types = normalizeTypes(data)
        if (types.length > 0) return types
      } catch {
        // fallback below
      }
      return FALLBACK_ENCYCLOPEDIA_TYPES.map((t) => ({ ...t }))
    },
  }
}
