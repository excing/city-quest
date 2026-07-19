import { BROWSE_HISTORY_MAX } from '../../../../core/config/constants'
import type { BrowseHistoryItem } from '../entities'

export interface UpsertBrowseInput {
  id: string
  name: string
  typeKey: string
  coverKey?: string | null
  intro?: string
  viewedAt?: string
}

export function upsertBrowseHistory(
  prev: readonly BrowseHistoryItem[],
  input: UpsertBrowseInput,
  max = BROWSE_HISTORY_MAX,
): BrowseHistoryItem[] {
  const viewedAt = input.viewedAt ?? new Date().toISOString()
  const nextItem: BrowseHistoryItem = {
    id: input.id,
    name: input.name,
    typeKey: input.typeKey,
    coverKey: input.coverKey ?? null,
    intro: input.intro,
    viewedAt,
  }
  const rest = prev.filter((x) => x.id !== input.id)
  const merged = [nextItem, ...rest]
  if (merged.length <= max) return merged
  return merged.slice(0, max)
}

export function clearBrowseHistory(): BrowseHistoryItem[] {
  return []
}
