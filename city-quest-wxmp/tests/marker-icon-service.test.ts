/**
 * Callers: vitest. Marker icon cache with injectable drawer (no real wx canvas).
 */
import { describe, expect, it, vi } from 'vitest'
import {
  createMarkerIconService,
  FALLBACK_MARKER_ICON,
  markerIconFileName,
} from '../miniprogram/features/encyclopedia/presentation/marker-icon-service'
import { markerIconCacheKey } from '../miniprogram/features/encyclopedia/presentation/marker-icon-style'

describe('markerIconFileName', () => {
  it('strips leading hash and replaces pipes', () => {
    expect(markerIconFileName('#f97316|0')).toBe('f97316_0.png')
    expect(markerIconFileName('#f97316|1')).toBe('f97316_1.png')
  })
})

describe('createMarkerIconService', () => {
  it('draws once per cache key and reuses path', async () => {
    const drawAndExport = vi.fn(async (style) => {
      return `mock://${style.color}|${style.selected ? 1 : 0}`
    })
    const svc = createMarkerIconService({ drawAndExport })

    const a = await svc.ensure('#F97316', false)
    const b = await svc.ensure('#f97316', false)
    expect(a).toBe('mock://#f97316|0')
    expect(b).toBe(a)
    expect(drawAndExport).toHaveBeenCalledTimes(1)
    expect(svc.pathOf('#F97316', false)).toBe(a)
  })

  it('singleflights concurrent ensures for same key', async () => {
    let resolveDraw!: (path: string) => void
    const drawAndExport = vi.fn(
      () =>
        new Promise<string>((resolve) => {
          resolveDraw = resolve
        }),
    )
    const svc = createMarkerIconService({ drawAndExport })

    const p1 = svc.ensure('#22C55E', true)
    const p2 = svc.ensure('#22c55e', true)
    expect(drawAndExport).toHaveBeenCalledTimes(1)
    resolveDraw('mock://selected')
    await expect(Promise.all([p1, p2])).resolves.toEqual([
      'mock://selected',
      'mock://selected',
    ])
  })

  it('ensureAll warms all entries', async () => {
    const drawAndExport = vi.fn(async (style) => `p:${style.color}:${style.selected}`)
    const svc = createMarkerIconService({ drawAndExport })
    await svc.ensureAll([
      { color: '#F97316', selected: false },
      { color: '#F97316', selected: true },
    ])
    expect(svc.pathOf('#F97316', false)).toBe('p:#f97316:false')
    expect(svc.pathOf('#F97316', true)).toBe('p:#f97316:true')
  })

  it('falls back without poisoning cache so next ensure can retry', async () => {
    let fail = true
    const drawAndExport = vi.fn(async () => {
      if (fail) throw new Error('boom')
      return 'mock://ok'
    })
    const svc = createMarkerIconService({ drawAndExport })

    expect(await svc.ensure('#000000', false)).toBe(FALLBACK_MARKER_ICON)
    expect(svc.pathOf('#000000', false)).toBeNull()

    fail = false
    expect(await svc.ensure('#000000', false)).toBe('mock://ok')
    expect(drawAndExport).toHaveBeenCalledTimes(2)
    expect(svc.pathOf('#000000', false)).toBe('mock://ok')
  })

  it('pathOf is null before ensure', () => {
    const svc = createMarkerIconService({
      drawAndExport: async () => 'x',
    })
    expect(svc.pathOf('#abcabc', false)).toBeNull()
    expect(markerIconCacheKey('#abcabc', false)).toBe('#abcabc|0')
  })
})
