import type { MapMarkerVm } from '../../../../core/map/types'
import type { EncyclopediaListItem } from '../entities'

export function toMapMarkers(
  items: readonly EncyclopediaListItem[],
  selectedId?: string | null,
): MapMarkerVm[] {
  return items.map((item) => ({
    id: item.id,
    lng: item.lng,
    lat: item.lat,
    styleKey: item.typeKey,
    title: item.name,
    selected: selectedId ? item.id === selectedId : false,
  }))
}
