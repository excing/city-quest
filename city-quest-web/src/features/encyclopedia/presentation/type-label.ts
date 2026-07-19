import type { EncyclopediaType } from '../domain/entities'
import {
  DEFAULT_ENCYCLOPEDIA_TYPES,
  DEFAULT_TYPE_COLOR,
} from '../domain/type-defaults'

export function buildTypeMap(
  types: readonly EncyclopediaType[],
): Record<string, EncyclopediaType> {
  const map: Record<string, EncyclopediaType> = {}
  for (const t of DEFAULT_ENCYCLOPEDIA_TYPES) {
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
  return typeMap[typeKey]?.color ?? DEFAULT_TYPE_COLOR
}
