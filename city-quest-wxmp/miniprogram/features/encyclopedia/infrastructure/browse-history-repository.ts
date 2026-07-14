/**
 * Local browse history repository.
 * Callers: composition → application.
 */

import type { KvStorage } from '../../../core/storage/kv'
import { StorageKeys } from '../../../core/storage/keys'
import type { BrowseHistoryItem } from '../domain/entities'
import type { BrowseHistoryRepository } from '../domain/ports'
import {
  clearBrowseHistory,
  upsertBrowseHistory,
  type UpsertBrowseInput,
} from '../domain/rules/browse-history'

export function createBrowseHistoryRepository(kv: KvStorage): BrowseHistoryRepository {
  return {
    list(): BrowseHistoryItem[] {
      const raw = kv.getJson<BrowseHistoryItem[]>(StorageKeys.browseHistory)
      return Array.isArray(raw) ? raw.map((x) => ({ ...x })) : []
    },
    upsert(item: UpsertBrowseInput): BrowseHistoryItem[] {
      const prev = this.list()
      const next = upsertBrowseHistory(prev, item)
      kv.setJson(StorageKeys.browseHistory, next)
      return next
    },
    clear(): void {
      const empty = clearBrowseHistory()
      kv.setJson(StorageKeys.browseHistory, empty)
    },
  }
}
