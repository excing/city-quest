/**
 * Callers: Encyclopedia list/form views (fallback when static asset / API unavailable).
 * Keep in sync with server src/assets/config/encyclopedia-types.json keys.
 */
import type { EncyclopediaType } from '../api/client'

export const ENCYCLOPEDIA_TYPES: EncyclopediaType[] = [
  { key: 'food', name: '美食', color: '#F97316' },
  { key: 'scenic', name: '景点', color: '#22C55E' },
  { key: 'goods', name: '其他', color: '#3B82F6' },
]
