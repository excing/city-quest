/**
 * Use case: load map points + types.
 * Callers: map presentation via public API.
 */

import type { MapMarkerVm, MapViewport } from '../../../core/map/types'
import { viewportFromMarkers } from '../../../core/map/viewport'
import type { EncyclopediaListItem, EncyclopediaType } from '../domain/entities'
import type { EncyclopediaRepository } from '../domain/ports'
import { toMapMarkers } from '../domain/rules/markers'

export interface LoadMapPointsResult {
  items: EncyclopediaListItem[]
  types: EncyclopediaType[]
  markers: MapMarkerVm[]
  viewport: MapViewport
}

export function createLoadMapPoints(repo: EncyclopediaRepository) {
  return async function loadMapPoints(
    selectedId?: string | null,
  ): Promise<LoadMapPointsResult> {
    const [items, types] = await Promise.all([
      repo.listPublished(),
      repo.listTypes(),
    ])
    const markers = toMapMarkers(items, selectedId)
    const viewport = viewportFromMarkers(markers)
    return { items, types, markers, viewport }
  }
}
