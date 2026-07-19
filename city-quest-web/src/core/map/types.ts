/**
 * Map view models — play-agnostic.
 * Callers: feature application → presentation; core map helpers.
 * Coordinates: GCJ-02 only (same as miniprogram / server).
 */

export interface MapMarkerVm {
  id: string
  lng: number
  lat: number
  styleKey: string
  selected?: boolean
  title?: string
}

export interface MapPoint {
  lng: number
  lat: number
}

export interface MapViewport {
  includePoints?: MapPoint[]
  center?: MapPoint
  zoom?: number
}
