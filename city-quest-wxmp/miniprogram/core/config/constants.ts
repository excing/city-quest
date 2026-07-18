/**
 * Global constants (no business feature names beyond product defaults).
 * Callers: core/*, features via public compose. Schema: none.
 */

/** Max local browse-history entries (PRD / tech plan). */
export const BROWSE_HISTORY_MAX = 200

/** Default request timeout (ms). */
export const HTTP_TIMEOUT_MS = 15_000

/** Dali city center — GCJ-02 (tech plan fallback). */
export const DEFAULT_MAP_CENTER = {
  lng: 100.19,
  lat: 25.69,
} as const

export const DEFAULT_MAP_SCALE = 12

/** Zoom level when centering the map on a single encyclopedia point. */
export const LOCATE_MAP_SCALE = 16

/** Storage key namespace version. */
export const STORAGE_NS = 'cq/v1'
