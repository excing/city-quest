import { describe, expect, it } from 'vitest'
import {
  normalizeListItem,
  normalizePublishedList,
} from '../miniprogram/features/encyclopedia/domain/rules/normalize-list'

describe('normalizeListItem', () => {
  it('accepts valid GCJ-02 row', () => {
    expect(
      normalizeListItem({
        id: 'a',
        name: '店',
        typeKey: 'food',
        lng: 100.1,
        lat: 25.6,
        intro: 'hi',
      }),
    ).toEqual({
      id: 'a',
      name: '店',
      typeKey: 'food',
      lng: 100.1,
      lat: 25.6,
      intro: 'hi',
    })
  })

  it('drops missing id / invalid coords', () => {
    expect(
      normalizeListItem({
        name: 'x',
        typeKey: 'food',
        lng: 100,
        lat: 25,
      }),
    ).toBeNull()
    expect(
      normalizeListItem({
        id: 'a',
        name: 'x',
        typeKey: 'food',
        lng: 200,
        lat: 25,
      }),
    ).toBeNull()
  })

  it('coerces numeric strings and defaults intro', () => {
    expect(
      normalizeListItem({
        id: 'a',
        name: 'x',
        typeKey: 'scenic',
        lng: '100.2',
        lat: '25.7',
      }),
    ).toMatchObject({ lng: 100.2, lat: 25.7, intro: '' })
  })
})

describe('normalizePublishedList', () => {
  it('filters invalid rows and non-arrays', () => {
    expect(normalizePublishedList(null)).toEqual([])
    expect(
      normalizePublishedList([
        {
          id: 'ok',
          name: 'A',
          typeKey: 'food',
          lng: 1,
          lat: 2,
          intro: '',
        },
        { id: '', name: 'bad' },
      ]),
    ).toHaveLength(1)
  })
})
