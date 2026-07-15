/**
 * TTL cache decorator over EncyclopediaRepository (architecture §9).
 * Callers: composition root only. Application keeps calling ports unchanged.
 */

import type {
  EncyclopediaDetail,
  EncyclopediaListItem,
  EncyclopediaType,
} from '../domain/entities'
import type { EncyclopediaRepository } from '../domain/ports'

/** List points change more often than type config. */
export const ENCYCLOPEDIA_LIST_TTL_MS = 60_000
export const ENCYCLOPEDIA_TYPES_TTL_MS = 60 * 60_000

interface CacheEntry<T> {
  value: T
  expiresAt: number
}

export interface CachedEncyclopediaRepository extends EncyclopediaRepository {
  /** Drop list and/or types memory cache (force network on next read). */
  invalidateCache(scope?: 'list' | 'types' | 'all'): void
}

export interface CreateCachedEncyclopediaRepositoryOptions {
  listTtlMs?: number
  typesTtlMs?: number
  /** Injectable clock for tests. */
  now?: () => number
}

export function createCachedEncyclopediaRepository(
  inner: EncyclopediaRepository,
  options?: CreateCachedEncyclopediaRepositoryOptions,
): CachedEncyclopediaRepository {
  const listTtlMs = options?.listTtlMs ?? ENCYCLOPEDIA_LIST_TTL_MS
  const typesTtlMs = options?.typesTtlMs ?? ENCYCLOPEDIA_TYPES_TTL_MS
  const now = options?.now ?? (() => Date.now())

  let listCache: CacheEntry<EncyclopediaListItem[]> | null = null
  let typesCache: CacheEntry<EncyclopediaType[]> | null = null
  let listInflight: Promise<EncyclopediaListItem[]> | null = null
  let typesInflight: Promise<EncyclopediaType[]> | null = null

  function readListCache(): EncyclopediaListItem[] | null {
    if (!listCache) return null
    if (now() >= listCache.expiresAt) {
      listCache = null
      return null
    }
    // Return a shallow copy so callers cannot mutate the cache entry.
    return listCache.value.map((item) => ({ ...item }))
  }

  function readTypesCache(): EncyclopediaType[] | null {
    if (!typesCache) return null
    if (now() >= typesCache.expiresAt) {
      typesCache = null
      return null
    }
    return typesCache.value.map((t) => ({ ...t }))
  }

  async function listPublished(): Promise<EncyclopediaListItem[]> {
    const hit = readListCache()
    if (hit) return hit
    if (listInflight) {
      const shared = await listInflight
      return shared.map((item) => ({ ...item }))
    }

    listInflight = (async () => {
      const data = await inner.listPublished()
      listCache = {
        value: data.map((item) => ({ ...item })),
        expiresAt: now() + listTtlMs,
      }
      return listCache.value
    })()

    try {
      const data = await listInflight
      return data.map((item) => ({ ...item }))
    } finally {
      listInflight = null
    }
  }

  async function listTypes(): Promise<EncyclopediaType[]> {
    const hit = readTypesCache()
    if (hit) return hit
    if (typesInflight) {
      const shared = await typesInflight
      return shared.map((t) => ({ ...t }))
    }

    typesInflight = (async () => {
      const data = await inner.listTypes()
      typesCache = {
        value: data.map((t) => ({ ...t })),
        expiresAt: now() + typesTtlMs,
      }
      return typesCache.value
    })()

    try {
      const data = await typesInflight
      return data.map((t) => ({ ...t }))
    } finally {
      typesInflight = null
    }
  }

  function invalidateCache(scope: 'list' | 'types' | 'all' = 'all'): void {
    if (scope === 'list' || scope === 'all') {
      listCache = null
      listInflight = null
    }
    if (scope === 'types' || scope === 'all') {
      typesCache = null
      typesInflight = null
    }
  }

  return {
    listPublished,
    listTypes,
    getById(id: string): Promise<EncyclopediaDetail> {
      // Detail is not cached here (auth-sensitive isFavorited).
      return inner.getById(id)
    },
    invalidateCache,
  }
}
