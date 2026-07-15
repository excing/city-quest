/**
 * MapMarkerVm + type colors → WeChat <map> markers.
 * Callers: pages/map only (presentation). iconPath injected by page cache.
 */

import type { MapMarkerVm } from '../../../core/map/types'
import { markerIconStyle } from './marker-icon-style'

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

/**
 * Build wx markers. Numeric id is index; encyclopediaId kept for taps.
 * colorOf / iconPathOf are pure injectors (map page supplies type colors + cache).
 */
export function toWxMapMarkers(
  markers: readonly MapMarkerVm[],
  selectedId: string | null | undefined,
  colorOf: (styleKey: string) => string,
  iconPathOf: (color: string, selected: boolean) => string,
): WxMapMarker[] {
  return markers.map((m, index) => {
    const selected = selectedId ? m.id === selectedId : Boolean(m.selected)
    const color = colorOf(m.styleKey)
    const style = markerIconStyle(color, selected)
    return {
      id: index,
      latitude: m.lat,
      longitude: m.lng,
      iconPath: iconPathOf(color, selected),
      width: style.displaySize,
      height: style.displaySize,
      encyclopediaId: m.id,
    }
  })
}

/**
 * Unique (color, selected) pairs needed to render markers.
 * Always includes both selected states for each distinct color so selection
 * rebuild can stay synchronous after first warm.
 */
export function collectMarkerIconRequests(
  markers: readonly MapMarkerVm[],
  colorOf: (styleKey: string) => string,
): Array<{ color: string; selected: boolean }> {
  const colors = new Set<string>()
  for (const m of markers) {
    colors.add(colorOf(m.styleKey))
  }
  const requests: Array<{ color: string; selected: boolean }> = []
  for (const color of colors) {
    requests.push({ color, selected: false })
    requests.push({ color, selected: true })
  }
  return requests
}
