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
export type {
  LoadMapPointsOptions,
  LoadMapPointsResult,
} from './application/load-map-points'
export { createOpenDetail } from './application/open-detail'
export {
  createAddFavorite,
  createListFavorites,
  createRemoveFavorite,
} from './application/favorites'

export { createEncyclopediaRepository } from './infrastructure/encyclopedia-repository'
export {
  createCachedEncyclopediaRepository,
  ENCYCLOPEDIA_LIST_TTL_MS,
  ENCYCLOPEDIA_TYPES_TTL_MS,
} from './infrastructure/cached-encyclopedia-repository'
export type { CachedEncyclopediaRepository } from './infrastructure/cached-encyclopedia-repository'
export { createFavoriteRepository } from './infrastructure/favorite-repository'
export { createBrowseHistoryRepository } from './infrastructure/browse-history-repository'

export { upsertBrowseHistory } from './domain/rules/browse-history'
export { toMapMarkers } from './domain/rules/markers'
export {
  buildTypeMap,
  typeColorOf,
  typeNameOf,
} from './presentation/type-label'

export const EncyclopediaRoutes = {
  map: '/',
  detail: '/detail',
  history: '/history',
  favorites: '/favorites',
} as const

export function detailUrl(id: string): string {
  return `${EncyclopediaRoutes.detail}/${encodeURIComponent(id)}`
}
