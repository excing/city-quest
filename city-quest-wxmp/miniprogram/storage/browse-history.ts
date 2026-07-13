/**
 * Callers: pages/detail (write), pages/history (read/clear).
 * Schema: local array of BrowseHistoryItem, max 200, MRU dedupe.
 * User: 阅读 @docs , 然后选择合适的agents或skills, 开始进行开发.
 */

export interface BrowseHistoryItem {
  id: string
  name: string
  typeKey: string
  coverUrl?: string | null
  intro?: string
  viewedAt: number
}

const STORAGE_KEY = 'city_quest_browse_history'
export const BROWSE_HISTORY_MAX = 200

function readRaw(): BrowseHistoryItem[] {
  try {
    const value = wx.getStorageSync(STORAGE_KEY) as BrowseHistoryItem[] | undefined
    if (!Array.isArray(value)) {
      return []
    }
    return value
  } catch {
    return []
  }
}

function writeRaw(items: BrowseHistoryItem[]): void {
  wx.setStorageSync(STORAGE_KEY, items)
}

/** Pure: dedupe by id, move to front, cap length */
export function upsertBrowseHistory(
  items: readonly BrowseHistoryItem[],
  next: BrowseHistoryItem,
  max = BROWSE_HISTORY_MAX,
): BrowseHistoryItem[] {
  const filtered = items.filter((item) => item.id !== next.id)
  return [next, ...filtered].slice(0, max)
}

export function listBrowseHistory(): BrowseHistoryItem[] {
  return readRaw()
}

export function recordBrowse(
  item: Omit<BrowseHistoryItem, 'viewedAt'> & { viewedAt?: number },
): BrowseHistoryItem[] {
  const entry: BrowseHistoryItem = {
    id: item.id,
    name: item.name,
    typeKey: item.typeKey,
    coverUrl: item.coverUrl ?? null,
    intro: item.intro,
    viewedAt: item.viewedAt ?? Date.now(),
  }
  const updated = upsertBrowseHistory(readRaw(), entry)
  writeRaw(updated)
  return updated
}

export function clearBrowseHistory(): void {
  writeRaw([])
}
