/**
 * MapMarkerVm + type colors → WeChat <map> markers.
 * Callers: pages/map only (presentation).
 */

import type { MapMarkerVm } from '../../../core/map/types'

const MARKER_BASE = '/assets/markers'

const KNOWN_STYLE_KEYS = new Set([
  'food',
  'scenic',
  'library',
  'toilet',
  'facility',
  'goods',
  'default',
])

export interface WxMapMarker {
  id: number
  latitude: number
  longitude: number
  iconPath: string
  width: number
  height: number
  /** Domain id for navigation */
  encyclopediaId: string
}

function iconFor(styleKey: string, selected: boolean): string {
  const key = KNOWN_STYLE_KEYS.has(styleKey) ? styleKey : 'default'
  return selected
    ? `${MARKER_BASE}/${key}-selected.png`
    : `${MARKER_BASE}/${key}.png`
}

/**
 * Build wx markers. Numeric id is index; encyclopediaId kept for taps.
 */
export function toWxMapMarkers(
  markers: readonly MapMarkerVm[],
  selectedId?: string | null,
): WxMapMarker[] {
  return markers.map((m, index) => {
    const selected = selectedId ? m.id === selectedId : Boolean(m.selected)
    return {
      id: index,
      latitude: m.lat,
      longitude: m.lng,
      iconPath: iconFor(m.styleKey, selected),
      width: selected ? 32 : 24,
      height: selected ? 32 : 24,
      encyclopediaId: m.id,
    }
  })
}
