/**
 * Resolve typeKey → display name / color.
 * Callers: encyclopedia presentation pages (via public.ts).
 * Defaults mirror types-fallback when remote types missing; no infra import.
 */

import type { EncyclopediaType } from '../domain/entities'

/** Local display defaults when page only has typeKey. */
const DEFAULT_TYPES: readonly EncyclopediaType[] = [
  { key: 'food', name: '美食', color: '#F97316' },
  { key: 'scenic', name: '景点', color: '#22C55E' },
  { key: 'library', name: '图书馆', color: '#8B5CF6' },
  { key: 'toilet', name: '厕所', color: '#64748B' },
  { key: 'facility', name: '公共设施', color: '#EC4899' },
  { key: 'goods', name: '其他', color: '#3B82F6' },
]

export function buildTypeMap(
  types: readonly EncyclopediaType[],
): Record<string, EncyclopediaType> {
  const map: Record<string, EncyclopediaType> = {}
  for (const t of DEFAULT_TYPES) {
    map[t.key] = t
  }
  for (const t of types) {
    map[t.key] = t
  }
  return map
}

export function typeNameOf(
  typeKey: string,
  typeMap: Record<string, EncyclopediaType>,
): string {
  return typeMap[typeKey]?.name ?? typeKey
}

export function typeColorOf(
  typeKey: string,
  typeMap: Record<string, EncyclopediaType>,
): string {
  return typeMap[typeKey]?.color ?? '#2B4C7E'
}
