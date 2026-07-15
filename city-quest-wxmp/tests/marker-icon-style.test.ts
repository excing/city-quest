/**
 * Callers: vitest. Pure marker icon style helpers.
 * Call site of production code: imports marker-icon-style.ts.
 * No existing equivalent test file (only wx-markers.test.ts for static paths).
 * No data-file I/O.
 * User: 把现在的微信小程序微信地图的 marker 用svg替代或直接绘制...
 */
import { describe, expect, it } from 'vitest'
import {
  DEFAULT_MARKER_COLOR,
  markerIconCacheKey,
  markerIconStyle,
  normalizeMarkerColor,
} from '../miniprogram/features/encyclopedia/presentation/marker-icon-style'

describe('normalizeMarkerColor', () => {
  it('lowercases and trims hex colors', () => {
    expect(normalizeMarkerColor('  #F97316 ')).toBe('#f97316')
  })

  it('expands 3-digit hex', () => {
    expect(normalizeMarkerColor('#abc')).toBe('#aabbcc')
  })

  it('falls back for empty or invalid', () => {
    expect(normalizeMarkerColor('')).toBe(DEFAULT_MARKER_COLOR)
    expect(normalizeMarkerColor('not-a-color')).toBe(DEFAULT_MARKER_COLOR)
    expect(normalizeMarkerColor('#gg0000')).toBe(DEFAULT_MARKER_COLOR)
  })
})

describe('markerIconCacheKey', () => {
  it('is stable for same color and selected', () => {
    expect(markerIconCacheKey('#F97316', false)).toBe(
      markerIconCacheKey('#f97316', false),
    )
    expect(markerIconCacheKey('#F97316', true)).toBe('#f97316|1')
    expect(markerIconCacheKey('#F97316', false)).toBe('#f97316|0')
  })

  it('differs by color and selected', () => {
    expect(markerIconCacheKey('#f97316', false)).not.toBe(
      markerIconCacheKey('#22c55e', false),
    )
    expect(markerIconCacheKey('#f97316', false)).not.toBe(
      markerIconCacheKey('#f97316', true),
    )
  })
})

describe('markerIconStyle', () => {
  it('uses normal display size and canvas 2x', () => {
    const style = markerIconStyle('#F97316', false)
    expect(style).toMatchObject({
      color: '#f97316',
      selected: false,
      displaySize: 24,
      canvasSize: 48,
    })
    expect(style.radius).toBeGreaterThan(0)
    expect(style.strokeWidth).toBeGreaterThan(0)
    expect(style.radius + style.strokeWidth / 2).toBeLessThanOrEqual(
      style.canvasSize / 2,
    )
  })

  it('uses larger selected size and thicker stroke', () => {
    const normal = markerIconStyle('#22C55E', false)
    const selected = markerIconStyle('#22C55E', true)
    expect(selected.displaySize).toBe(32)
    expect(selected.canvasSize).toBe(64)
    expect(selected.displaySize).toBeGreaterThan(normal.displaySize)
    expect(selected.strokeWidth).toBeGreaterThanOrEqual(normal.strokeWidth)
  })
})
