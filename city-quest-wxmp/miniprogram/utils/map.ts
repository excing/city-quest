/**
 * Callers: pages/map.
 * Builds map markers and include-points from encyclopedia list + types.
 * User: 阅读 @docs , 然后选择合适的agents或skills, 开始进行开发.
 */
import type { EncyclopediaMapItem, EncyclopediaType } from '../services/encyclopedia'

/** Dali downtown fallback (GCJ-02) when no points */
export const DALI_CENTER = {
  longitude: 100.19,
  latitude: 25.69,
}

export const DEFAULT_SCALE = 12

export interface MapMarker {
  id: number
  encyclopediaId: string
  longitude: number
  latitude: number
  width: number
  height: number
  iconPath?: string
  title?: string
  color: string
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

/**
 * WeChat map markers require numeric id. Map encyclopedia uuid → index.
 */
export function buildMarkers(
  items: readonly EncyclopediaMapItem[],
  types: readonly EncyclopediaType[],
): MapMarker[] {
  return items.map((item, index) => ({
    id: index,
    encyclopediaId: item.id,
    longitude: item.lng,
    latitude: item.lat,
    width: 24,
    height: 24,
    title: item.name,
    color: colorForType(item.typeKey, types),
  }))
}

export function buildIncludePoints(
  items: readonly EncyclopediaMapItem[],
): Array<{ longitude: number; latitude: number }> {
  return items.map((item) => ({
    longitude: item.lng,
    latitude: item.lat,
  }))
}
