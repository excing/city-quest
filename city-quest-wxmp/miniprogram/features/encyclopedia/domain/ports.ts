/**
 * Encyclopedia ports (dependency inversion).
 * Callers: application; implemented by infrastructure.
 */

import type {
  BrowseHistoryItem,
  EncyclopediaDetail,
  EncyclopediaListItem,
  EncyclopediaType,
  FavoriteListItem,
} from './entities'

export interface EncyclopediaRepository {
  listPublished(): Promise<EncyclopediaListItem[]>
  getById(id: string): Promise<EncyclopediaDetail>
  listTypes(): Promise<EncyclopediaType[]>
}

export interface FavoriteRepository {
  list(): Promise<FavoriteListItem[]>
  add(encyclopediaId: string): Promise<void>
  remove(encyclopediaId: string): Promise<void>
}

export interface BrowseHistoryRepository {
  list(): BrowseHistoryItem[]
  upsert(item: Omit<BrowseHistoryItem, 'viewedAt'> & { viewedAt?: string }): BrowseHistoryItem[]
  clear(): void
}
