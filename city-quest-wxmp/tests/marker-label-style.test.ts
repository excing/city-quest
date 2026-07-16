/**
 * Callers: vitest. Pure marker label style helpers.
 * Values must match marker-label-style.ts (user-tuned source of truth).
 */
import { describe, expect, it } from 'vitest'
import {
  MARKER_LABEL_BG_TRANSPARENT,
  MARKER_LABEL_INK,
  MARKER_LABEL_MAX_CHARS,
  markerLabelContent,
  markerLabelStyle,
} from '../miniprogram/features/encyclopedia/presentation/marker-label-style'

describe('markerLabelContent', () => {
  it('returns empty for missing or whitespace titles', () => {
    expect(markerLabelContent(undefined)).toBe('')
    expect(markerLabelContent('')).toBe('')
    expect(markerLabelContent('   ')).toBe('')
  })

  it('keeps short titles intact', () => {
    expect(markerLabelContent('面馆')).toBe('面馆')
    expect(markerLabelContent('  双廊古镇  ')).toBe('双廊古镇')
  })

  it('truncates long titles with ellipsis at default max', () => {
    const long = '喜洲白族民居建筑群导览'
    expect(long.length).toBeGreaterThan(MARKER_LABEL_MAX_CHARS)
    expect(markerLabelContent(long)).toBe(
      `${long.slice(0, MARKER_LABEL_MAX_CHARS)}…`,
    )
  })

  it('respects custom maxChars', () => {
    expect(markerLabelContent('abcdefghij', 4)).toBe('abcd…')
  })
})

describe('markerLabelStyle', () => {
  it('returns null when title is empty', () => {
    expect(markerLabelStyle(undefined, '#F97316', false)).toBeNull()
    expect(markerLabelStyle('  ', '#F97316', true)).toBeNull()
  })

  it('builds plain text on the right of a normal disc', () => {
    const label = markerLabelStyle('双廊古镇', '#F97316', false)
    expect(label).toMatchObject({
      content: '双廊古镇',
      color: MARKER_LABEL_INK,
      fontSize: 14,
      bgColor: MARKER_LABEL_BG_TRANSPARENT,
      borderRadius: 0,
      borderWidth: 0,
      padding: 0,
      textAlign: 'right',
      // displaySize 18: anchorX = 9+2, anchorY = -9
      anchorX: 18 / 2 + 2,
      anchorY: 0 - 18 / 2,
    })
  })

  it('uses larger plain text when selected (still ink, no background)', () => {
    const label = markerLabelStyle('面馆', '#F97316', true)
    expect(label).toMatchObject({
      content: '面馆',
      color: MARKER_LABEL_INK,
      fontSize: 18,
      bgColor: MARKER_LABEL_BG_TRANSPARENT,
      borderRadius: 0,
      borderWidth: 0,
      padding: 0,
      textAlign: 'right',
      // displaySize 24: anchorX = 12+2, anchorY = -12
      anchorX: 24 / 2 + 2,
      anchorY: 0 - 24 / 2,
    })
  })

  it('truncates content in style output', () => {
    const label = markerLabelStyle('喜洲白族民居建筑群导览', '#22C55E', false)
    expect(label?.content).toBe('喜洲白族民居建筑…')
  })
})
