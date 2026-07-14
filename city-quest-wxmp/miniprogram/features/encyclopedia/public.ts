/**
 * Encyclopedia feature public API — only surface other modules may import.
 * Callers: app composition, thin pages.
 */

export type {
  BrowseHistoryItem,
  EncyclopediaDetail,
  EncyclopediaListItem,
  EncyclopediaType,
  FavoriteListItem,
} from './domain/entities'

export type {
  BrowseHistoryRepository,
  EncyclopediaRepository,
  FavoriteRepository,
} from './domain/ports'

export { createLoadMapPoints } from './application/load-map-points'
export type { LoadMapPointsResult } from './application/load-map-points'
export { createOpenDetail } from './application/open-detail'
export {
  createAddFavorite,
  createListFavorites,
  createRemoveFavorite,
} from './application/favorites'

export { createEncyclopediaRepository } from './infrastructure/encyclopedia-repository'
export { createFavoriteRepository } from './infrastructure/favorite-repository'
export { createBrowseHistoryRepository } from './infrastructure/browse-history-repository'

export { upsertBrowseHistory } from './domain/rules/browse-history'
export { toMapMarkers } from './domain/rules/markers'

/** Route constants for this feature (main package). */
export const EncyclopediaRoutes = {
  map: '/pages/map/map',
  detail: '/pages/detail/detail',
  history: '/package-account/pages/history/history',
  favorites: '/package-account/pages/favorites/favorites',
} as const
