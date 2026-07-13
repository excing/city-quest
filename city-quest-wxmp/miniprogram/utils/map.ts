/**
 * Callers: pages/map, pages/detail, favorites, history.
 * Builds map markers and include-points from encyclopedia list + types.
 */
import type { EncyclopediaMapItem, EncyclopediaType } from '../services/encyclopedia'

/** Dali downtown fallback (GCJ-02) when no points */
export const DALI_CENTER = {
  longitude: 100.19,
  latitude: 25.69,
}

export const DEFAULT_SCALE = 12

const MARKER_ICON_BASE = '/assets/markers'
const KNOWN_TYPE_KEYS = new Set(['food', 'scenic', 'goods'])

export interface MapMarker {
  id: number
  encyclopediaId: string
  longitude: number
  latitude: number
  width: number
  height: number
  iconPath: string
  title?: string
  color: string
  zIndex?: number
}

export function colorForType(
  typeKey: string,
  types: readonly EncyclopediaType[],
  fallback = '#2B4C7E',
): string {
  return types.find((t) => t.key === typeKey)?.color ?? fallback
}

export function typeNameForKey(
  typeKey: string,
  types: readonly EncyclopediaType[],
): string {
  return types.find((t) => t.key === typeKey)?.name ?? typeKey
}

export function markerIconPath(typeKey: string, selected = false): string {
  const key = KNOWN_TYPE_KEYS.has(typeKey) ? typeKey : 'default'
  const suffix = selected ? '-selected' : ''
  return `${MARKER_ICON_BASE}/marker-${key}${suffix}.png`
}

/**
 * WeChat map markers require numeric id. Map encyclopedia uuid → index.
 * Selected marker uses larger icon + higher zIndex for visual feedback.
 */
export function buildMarkers(
  items: readonly EncyclopediaMapItem[],
  types: readonly EncyclopediaType[],
  selectedId: string | null = null,
): MapMarker[] {
  return items.map((item, index) => {
    const selected = selectedId === item.id
    return {
      id: index,
      encyclopediaId: item.id,
      longitude: item.lng,
      latitude: item.lat,
      width: selected ? 32 : 24,
      height: selected ? 32 : 24,
      iconPath: markerIconPath(item.typeKey, selected),
      title: item.name,
      color: colorForType(item.typeKey, types),
      zIndex: selected ? 10 : 1,
    }
  })
}

export function buildIncludePoints(
  items: readonly EncyclopediaMapItem[],
): Array<{ longitude: number; latitude: number }> {
  return items.map((item) => ({
    longitude: item.lng,
    latitude: item.lat,
  }))
}
