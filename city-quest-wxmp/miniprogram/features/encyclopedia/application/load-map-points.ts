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

export interface LoadMapPointsOptions {
  selectedId?: string | null
  /** Bypass repository TTL cache (e.g. user retry). */
  forceRefresh?: boolean
}

export interface LoadMapPointsDeps {
  /**
   * Optional cache control from decorator (architecture §9).
   * Absent when repository is uncached (tests).
   */
  invalidateCache?: (scope?: 'list' | 'types' | 'all') => void
}

export function createLoadMapPoints(
  repo: EncyclopediaRepository,
  deps?: LoadMapPointsDeps,
) {
  return async function loadMapPoints(
    selectedIdOrOptions?: string | null | LoadMapPointsOptions,
  ): Promise<LoadMapPointsResult> {
    // Back-compat: loadMapPoints(selectedId) | loadMapPoints({ selectedId, forceRefresh })
    let selectedId: string | null | undefined
    let forceRefresh = false
    if (
      selectedIdOrOptions !== null &&
      typeof selectedIdOrOptions === 'object' &&
      !Array.isArray(selectedIdOrOptions)
    ) {
      selectedId = selectedIdOrOptions.selectedId
      forceRefresh = Boolean(selectedIdOrOptions.forceRefresh)
    } else {
      selectedId = selectedIdOrOptions as string | null | undefined
    }

    if (forceRefresh) {
      deps?.invalidateCache?.('all')
    }

    const [items, types] = await Promise.all([
      repo.listPublished(),
      repo.listTypes(),
    ])
    const markers = toMapMarkers(items, selectedId)
    const viewport = viewportFromMarkers(markers)
    return { items, types, markers, viewport }
  }
}
