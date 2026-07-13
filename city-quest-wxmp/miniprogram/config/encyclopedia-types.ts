/**
 * Callers: map/detail/favorites/history pages (fallback when API types unavailable).
 * Keep in sync with server encyclopedia type keys.
 */
import type { EncyclopediaType } from '../services/encyclopedia'

export const ENCYCLOPEDIA_TYPES: EncyclopediaType[] = [
  { key: 'food', name: '美食', color: '#F97316' },
  { key: 'scenic', name: '美景', color: '#22C55E' },
  { key: 'goods', name: '美物', color: '#3B82F6' },
]
