/**
 * Map view models — play-agnostic.
 * Callers: feature application → presentation; core map helpers.
 * Coordinates: GCJ-02 only.
 */

export interface MapMarkerVm {
  id: string
  lng: number
  lat: number
  /** Style strategy key (color/icon), not a closed product enum in core. */
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
  scale?: number
}
