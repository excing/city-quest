/**
 * Pure marker icon geometry + cache keys (no wx).
 * Callers: wx-markers, marker-icon-service, tests.
 */

/** Matches typeColorOf fallback / design ink. */
export const DEFAULT_MARKER_COLOR = '#2b4c7e'

const NORMAL_DISPLAY = 24
const SELECTED_DISPLAY = 32
const PIXEL_RATIO = 2

/** White stroke in CSS px (design ~1.5–2). */
const NORMAL_STROKE_CSS = 1.5
const SELECTED_STROKE_CSS = 2

export interface MarkerIconStyle {
  color: string
  selected: boolean
  displaySize: number
  canvasSize: number
  /** Circle radius in canvas pixels (center to fill edge). */
  radius: number
  /** Stroke width in canvas pixels. */
  strokeWidth: number
}

/**
 * Normalize color for cache keys and canvas fill.
 * Accepts #RGB / #RRGGBB; otherwise DEFAULT_MARKER_COLOR.
 */
export function normalizeMarkerColor(color: string): string {
  const raw = color.trim().toLowerCase()
  if (/^#[0-9a-f]{6}$/.test(raw)) {
    return raw
  }
  if (/^#[0-9a-f]{3}$/.test(raw)) {
    const r = raw[1]
    const g = raw[2]
    const b = raw[3]
    return `#${r}${r}${g}${g}${b}${b}`
  }
  return DEFAULT_MARKER_COLOR
}

export function markerIconCacheKey(color: string, selected: boolean): string {
  return `${normalizeMarkerColor(color)}|${selected ? '1' : '0'}`
}

/**
 * Bitmap larger than the disc so the white stroke is not clipped.
 */
export function markerIconStyle(
  color: string,
  selected: boolean,
): MarkerIconStyle {
  const displaySize = selected ? SELECTED_DISPLAY : NORMAL_DISPLAY
  const canvasSize = displaySize * PIXEL_RATIO
  const strokeWidth =
    (selected ? SELECTED_STROKE_CSS : NORMAL_STROKE_CSS) * PIXEL_RATIO
  // Leave margin for half stroke on each side.
  const diameter = canvasSize - strokeWidth * 2 - 2
  const radius = diameter / 2

  return {
    color: normalizeMarkerColor(color),
    selected,
    displaySize,
    canvasSize,
    radius,
    strokeWidth,
  }
}
