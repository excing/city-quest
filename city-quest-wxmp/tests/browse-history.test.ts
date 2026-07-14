import { describe, expect, it } from 'vitest'
import { upsertBrowseHistory } from '../miniprogram/features/encyclopedia/domain/rules/browse-history'

describe('upsertBrowseHistory', () => {
  it('inserts new item at front', () => {
    const next = upsertBrowseHistory([], {
      id: 'a',
      name: 'A',
      typeKey: 'food',
      viewedAt: '2026-01-01T00:00:00.000Z',
    })
    expect(next).toHaveLength(1)
    expect(next[0].id).toBe('a')
  })

  it('dedupes and moves to front', () => {
    const prev = upsertBrowseHistory([], {
      id: 'a',
      name: 'A',
      typeKey: 'food',
      viewedAt: '2026-01-01T00:00:00.000Z',
    })
    const mid = upsertBrowseHistory(prev, {
      id: 'b',
      name: 'B',
      typeKey: 'scenic',
      viewedAt: '2026-01-02T00:00:00.000Z',
    })
    const next = upsertBrowseHistory(mid, {
      id: 'a',
      name: 'A2',
      typeKey: 'food',
      viewedAt: '2026-01-03T00:00:00.000Z',
    })
    expect(next.map((x) => x.id)).toEqual(['a', 'b'])
    expect(next[0].name).toBe('A2')
  })

  it('caps at max', () => {
    let list = upsertBrowseHistory([], {
      id: '0',
      name: '0',
      typeKey: 'food',
      viewedAt: '2026-01-01T00:00:00.000Z',
    })
    for (let i = 1; i < 5; i += 1) {
      list = upsertBrowseHistory(
        list,
        {
          id: String(i),
          name: String(i),
          typeKey: 'food',
          viewedAt: `2026-01-0${i + 1}T00:00:00.000Z`,
        },
        3,
      )
    }
    expect(list).toHaveLength(3)
    expect(list.map((x) => x.id)).toEqual(['4', '3', '2'])
  })
})
