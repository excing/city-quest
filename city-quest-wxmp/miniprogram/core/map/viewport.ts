/**
 * Viewport helpers for <map>.
 * Callers: feature presentation / application.
 */

import { DEFAULT_MAP_CENTER, DEFAULT_MAP_SCALE } from '../config/constants'
import type { MapMarkerVm, MapViewport } from './types'

export function viewportFromMarkers(markers: MapMarkerVm[]): MapViewport {
  if (markers.length === 0) {
    return {
      center: { ...DEFAULT_MAP_CENTER },
      scale: DEFAULT_MAP_SCALE,
    }
  }
  return {
    includePoints: markers.map((m) => ({ lng: m.lng, lat: m.lat })),
  }
}
