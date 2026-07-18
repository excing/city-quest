import { describe, expect, it } from 'vitest'
import {
  colorWithAlpha,
  coverMonogram,
  LIST_COVER_DEFAULT_TYPE_COLOR,
  LIST_COVER_PLACEHOLDER_ALPHA,
} from '../miniprogram/shared/ui/list-cover/helpers'

describe('coverMonogram', () => {
  it('returns first Chinese character', () => {
    expect(coverMonogram('宽窄巷子')).toBe('宽')
  })

  it('returns first Latin character', () => {
    expect(coverMonogram('Starbucks')).toBe('S')
  })

  it('trims whitespace before taking first char', () => {
    expect(coverMonogram('  锦里')).toBe('锦')
  })

  it('falls back to 探 for empty or blank name', () => {
    expect(coverMonogram('')).toBe('探')
    expect(coverMonogram('   ')).toBe('探')
    expect(coverMonogram(null)).toBe('探')
    expect(coverMonogram(undefined)).toBe('探')
  })

  it('handles surrogate pairs as one unit via Array.from', () => {
    expect(coverMonogram('🍜火锅')).toBe('🍜')
  })
})

describe('colorWithAlpha', () => {
  it('converts hex to rgba', () => {
    expect(colorWithAlpha('#F97316', 0.14)).toBe('rgba(249, 115, 22, 0.14)')
  })

  it('clamps alpha to [0, 1]', () => {
    expect(colorWithAlpha('#000000', -1)).toBe('rgba(0, 0, 0, 0)')
    expect(colorWithAlpha('#FFFFFF', 2)).toBe('rgba(255, 255, 255, 1)')
  })

  it('returns original when hex is invalid', () => {
    expect(colorWithAlpha('orange', 0.1)).toBe('orange')
    expect(colorWithAlpha('#fff', 0.1)).toBe('#fff')
  })

  it('exports default placeholder alpha and type color', () => {
    expect(LIST_COVER_PLACEHOLDER_ALPHA).toBeGreaterThan(0)
    expect(LIST_COVER_PLACEHOLDER_ALPHA).toBeLessThan(1)
    expect(LIST_COVER_DEFAULT_TYPE_COLOR).toMatch(/^#[0-9A-Fa-f]{6}$/)
  })
})
