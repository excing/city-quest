/**
 * Global constants (no business feature names beyond product defaults).
 * Callers: core/*, features via public compose.
 */

/** Max local browse-history entries. */
export const BROWSE_HISTORY_MAX = 200

/** Default request timeout (ms). */
export const HTTP_TIMEOUT_MS = 15_000

/** Dali city center — GCJ-02 (same as miniprogram). */
export const DEFAULT_MAP_CENTER = {
  lng: 100.19,
  lat: 25.69,
} as const

/** Leaflet zoom (WeChat scale≈12 ≈ zoom 12). */
export const DEFAULT_MAP_ZOOM = 12

/** Zoom level when centering the map on a single encyclopedia point. */
export const LOCATE_MAP_ZOOM = 16

/** Storage key namespace version. */
export const STORAGE_NS = 'cq/v1'

/**
 * OSM tile URL for the home map.
 * User requirement: https://tile.openstreetmap.de/{z}/{x}/{y}.png
 */
export const OSM_TILE_URL = 'https://tile.openstreetmap.de/{z}/{x}/{y}.png'

export const OSM_TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
