import { describe, expect, it, vi } from 'vitest'
import type {
  EncyclopediaDetail,
  EncyclopediaListItem,
  EncyclopediaType,
} from '../miniprogram/features/encyclopedia/domain/entities'
import type { EncyclopediaRepository } from '../miniprogram/features/encyclopedia/domain/ports'
import { createCachedEncyclopediaRepository } from '../miniprogram/features/encyclopedia/infrastructure/cached-encyclopedia-repository'
import { createLoadMapPoints } from '../miniprogram/features/encyclopedia/application/load-map-points'

function sampleItems(): EncyclopediaListItem[] {
  return [
    {
      id: '1',
      name: 'A',
      typeKey: 'food',
      lng: 100,
      lat: 25,
      intro: '',
    },
  ]
}

function sampleTypes(): EncyclopediaType[] {
  return [{ key: 'food', name: '美食', color: '#F97316' }]
}

function mockRepo(overrides?: Partial<EncyclopediaRepository>): EncyclopediaRepository {
  return {
    listPublished: vi.fn(async () => sampleItems()),
    listTypes: vi.fn(async () => sampleTypes()),
    getById: vi.fn(async (id: string): Promise<EncyclopediaDetail> => ({
      ...sampleItems()[0],
      id,
      tags: [],
      images: [],
    })),
    ...overrides,
  }
}

describe('createCachedEncyclopediaRepository', () => {
  it('hits memory cache within TTL and single-flights concurrent list', async () => {
    let now = 1_000
    const inner = mockRepo()
    const cached = createCachedEncyclopediaRepository(inner, {
      listTtlMs: 60_000,
      typesTtlMs: 3_600_000,
      now: () => now,
    })

    const [a, b] = await Promise.all([
      cached.listPublished(),
      cached.listPublished(),
    ])
    expect(a).toEqual(sampleItems())
    expect(b).toEqual(sampleItems())
    expect(inner.listPublished).toHaveBeenCalledTimes(1)

    await cached.listPublished()
    expect(inner.listPublished).toHaveBeenCalledTimes(1)

    now += 60_001
    await cached.listPublished()
    expect(inner.listPublished).toHaveBeenCalledTimes(2)
  })

  it('invalidateCache forces next network read', async () => {
    const inner = mockRepo()
    const cached = createCachedEncyclopediaRepository(inner, {
      now: () => 0,
    })
    await cached.listTypes()
    await cached.listTypes()
    expect(inner.listTypes).toHaveBeenCalledTimes(1)
    cached.invalidateCache('types')
    await cached.listTypes()
    expect(inner.listTypes).toHaveBeenCalledTimes(2)
  })

  it('does not cache getById', async () => {
    const inner = mockRepo()
    const cached = createCachedEncyclopediaRepository(inner)
    await cached.getById('1')
    await cached.getById('1')
    expect(inner.getById).toHaveBeenCalledTimes(2)
  })

  it('returns copies so mutation does not poison cache', async () => {
    const inner = mockRepo()
    const cached = createCachedEncyclopediaRepository(inner, { now: () => 0 })
    const first = await cached.listPublished()
    first[0].name = 'mutated'
    const second = await cached.listPublished()
    expect(second[0].name).toBe('A')
    expect(inner.listPublished).toHaveBeenCalledTimes(1)
  })
})

describe('createLoadMapPoints + cache invalidate', () => {
  it('forceRefresh invalidates before fetch', async () => {
    const inner = mockRepo()
    const cached = createCachedEncyclopediaRepository(inner, { now: () => 0 })
    const load = createLoadMapPoints(cached, {
      invalidateCache: (scope) => cached.invalidateCache(scope),
    })

    await load()
    await load()
    expect(inner.listPublished).toHaveBeenCalledTimes(1)

    await load({ forceRefresh: true })
    expect(inner.listPublished).toHaveBeenCalledTimes(2)
  })

  it('accepts legacy selectedId string argument', async () => {
    const inner = mockRepo()
    const load = createLoadMapPoints(inner)
    const result = await load('1')
    expect(result.markers[0]?.selected).toBe(true)
  })
})
