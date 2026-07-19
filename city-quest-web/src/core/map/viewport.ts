/**
 * Viewport helpers for the map.
 * Callers: feature presentation / application.
 */

import {
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  LOCATE_MAP_ZOOM,
} from '../config/constants'
import type { MapMarkerVm, MapPoint, MapViewport } from './types'

export function viewportFromMarkers(markers: MapMarkerVm[]): MapViewport {
  if (markers.length === 0) {
    return {
      center: { ...DEFAULT_MAP_CENTER },
      zoom: DEFAULT_MAP_ZOOM,
    }
  }
  return {
    includePoints: markers.map((m) => ({ lng: m.lng, lat: m.lat })),
  }
}

export function viewportForPoint(
  point: MapPoint,
  zoom: number = LOCATE_MAP_ZOOM,
): MapViewport {
  return {
    center: { lng: point.lng, lat: point.lat },
    zoom,
  }
}
