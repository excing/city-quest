/**
 * Pure helpers for list-cover component.
 * Callers: list-cover component, unit tests.
 */

/** First grapheme of name for monogram; falls back to product glyph. */
export function coverMonogram(name: string | null | undefined): string {
  const text = (name ?? '').trim()
  if (!text) return '探'
  const first = Array.from(text)[0]
  return first || '探'
}

/**
 * Soft fill from a solid hex color (e.g. type color).
 * Invalid input returns the original string unchanged.
 */
export function colorWithAlpha(hex: string, alpha: number): string {
  const raw = hex.trim()
  const m = /^#([0-9a-fA-F]{6})$/.exec(raw)
  if (!m) return raw
  const n = parseInt(m[1], 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  const a = Math.min(1, Math.max(0, alpha))
  return `rgba(${r}, ${g}, ${b}, ${a})`
}

/** Default soft alpha for list cover placeholders. */
export const LIST_COVER_PLACEHOLDER_ALPHA = 0.14

/** Design ink when type color missing. */
export const LIST_COVER_DEFAULT_TYPE_COLOR = '#2B4C7E'
