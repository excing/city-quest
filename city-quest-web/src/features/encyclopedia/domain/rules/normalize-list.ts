import type { EncyclopediaListItem } from '../entities'

const LNG_MIN = -180
const LNG_MAX = 180
const LAT_MIN = -90
const LAT_MAX = 90

function asFiniteNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value)
    if (Number.isFinite(n)) return n
  }
  return null
}

function asNonEmptyString(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const s = value.trim()
  return s.length > 0 ? s : null
}

export function normalizeListItem(raw: unknown): EncyclopediaListItem | null {
  if (raw === null || typeof raw !== 'object') return null
  const row = raw as Record<string, unknown>

  const id = asNonEmptyString(row.id)
  const name = asNonEmptyString(row.name)
  const typeKey = asNonEmptyString(row.typeKey)
  const lng = asFiniteNumber(row.lng)
  const lat = asFiniteNumber(row.lat)
  if (!id || !name || !typeKey || lng === null || lat === null) return null
  if (lng < LNG_MIN || lng > LNG_MAX || lat < LAT_MIN || lat > LAT_MAX) return null

  const intro = typeof row.intro === 'string' ? row.intro : ''
  return { id, name, typeKey, lng, lat, intro }
}

export function normalizePublishedList(raw: unknown): EncyclopediaListItem[] {
  if (!Array.isArray(raw)) return []
  const out: EncyclopediaListItem[] = []
  for (const row of raw) {
    const item = normalizeListItem(row)
    if (item) out.push(item)
  }
  return out
}
