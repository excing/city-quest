import type { FavoriteListItem } from '../domain/entities'
import type { FavoriteRepository } from '../domain/ports'

export function createListFavorites(repo: FavoriteRepository) {
  return function listFavorites(): Promise<FavoriteListItem[]> {
    return repo.list()
  }
}

export function createAddFavorite(repo: FavoriteRepository) {
  return function addFavorite(encyclopediaId: string): Promise<void> {
    return repo.add(encyclopediaId)
  }
}

export function createRemoveFavorite(repo: FavoriteRepository) {
  return function removeFavorite(encyclopediaId: string): Promise<void> {
    return repo.remove(encyclopediaId)
  }
}
