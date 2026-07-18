import { beforeEach, describe, expect, it } from 'vitest'
import {
  createMapPreferences,
  DEFAULT_MAP_SHOW_POI,
} from '../miniprogram/core/map/preferences'
import { createMemoryKvStorage } from '../miniprogram/core/storage/kv'
import { StorageKeys } from '../miniprogram/core/storage/keys'

describe('createMapPreferences', () => {
  let kv: ReturnType<typeof createMemoryKvStorage>

  beforeEach(() => {
    kv = createMemoryKvStorage()
  })

  it('defaults to hiding system POI when nothing is stored', () => {
    const prefs = createMapPreferences(kv)

    expect(DEFAULT_MAP_SHOW_POI).toBe(false)
    expect(prefs.getShowPoi()).toBe(false)
  })

  it('persists and restores the show-POI preference', () => {
    const prefs = createMapPreferences(kv)

    prefs.setShowPoi(true)
    expect(prefs.getShowPoi()).toBe(true)
    expect(kv.getJson<boolean>(StorageKeys.mapShowPoi)).toBe(true)

    prefs.setShowPoi(false)
    expect(prefs.getShowPoi()).toBe(false)
    expect(kv.getJson<boolean>(StorageKeys.mapShowPoi)).toBe(false)
  })

  it('falls back to default when stored value is not a boolean', () => {
    kv.setJson(StorageKeys.mapShowPoi, 'yes' as unknown as boolean)
    const prefs = createMapPreferences(kv)

    expect(prefs.getShowPoi()).toBe(DEFAULT_MAP_SHOW_POI)
  })
})
