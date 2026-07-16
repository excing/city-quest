/**
 * Pure marker name-label style (no wx).
 * Callers: wx-markers, tests.
 * Right-side always-on plain text (no chip background) after system POI is disabled.
 */

import { markerIconStyle } from './marker-icon-style'

/** Matches --color-ink. Default label text on map. */
export const MARKER_LABEL_INK = '#1a2332'

/** Transparent fill so only the name shows (no paper chip). */
export const MARKER_LABEL_BG_TRANSPARENT = '#00000000'

/** Max visible characters before ellipsis (CJK-friendly density). */
export const MARKER_LABEL_MAX_CHARS = 8

/** Gap between disc edge and label origin (CSS px). */
const LABEL_GAP_PX = 2

const LABEL_FONTSIZE = 14
const LABEL_FONTSIZE_SELECTED = 18

export interface WxMapMarkerLabel {
  content: string
  color: string
  fontSize: number
  bgColor: string
  borderRadius: number
  borderWidth: number
  padding: number
  textAlign: 'left' | 'right' | 'center'
  anchorX: number
  anchorY: number
}

/**
 * Truncate title for map density. Empty / whitespace → ''.
 */
export function markerLabelContent(
  title: string | undefined,
  maxChars: number = MARKER_LABEL_MAX_CHARS,
): string {
  const t = (title ?? '').trim()
  if (!t) return ''
  if (t.length <= maxChars) return t
  return `${t.slice(0, maxChars)}…`
}

/**
 * Build always-on right-side plain text label, or null when there is no name.
 * Ink color always; selected only bumps fontSize. Transparent bg (no chip).
 */
export function markerLabelStyle(
  title: string | undefined,
  typeColor: string,
  selected: boolean,
): WxMapMarkerLabel | null {
  const content = markerLabelContent(title)
  if (!content) return null

  const icon = markerIconStyle(typeColor, selected)
  const fontSize = selected ? LABEL_FONTSIZE_SELECTED : LABEL_FONTSIZE;
  const anchorX = icon.displaySize / 2 + LABEL_GAP_PX
  const anchorY = 0 - icon.displaySize / 2

  if (selected) {
    return {
      content,
      color: MARKER_LABEL_INK,
      fontSize: fontSize,
      bgColor: MARKER_LABEL_BG_TRANSPARENT,
      borderRadius: 0,
      borderWidth: 0,
      padding: 0,
      textAlign: 'right',
      anchorX,
      anchorY: anchorY,
    }
  }

  return {
    content,
    color: MARKER_LABEL_INK,
    fontSize: fontSize,
    bgColor: MARKER_LABEL_BG_TRANSPARENT,
    borderRadius: 0,
    borderWidth: 0,
    padding: 0,
    textAlign: 'right',
    anchorX,
    anchorY,
  }
}
