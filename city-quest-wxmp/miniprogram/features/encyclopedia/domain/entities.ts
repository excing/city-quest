/**
 * Encyclopedia domain entities (client-side).
 * Callers: encyclopedia application/infrastructure. No wx.
 * Image fields are server-issued media keys; resolve with fileUrl() for display.
 */

export interface EncyclopediaType {
  key: string
  name: string
  color: string
}

export interface EncyclopediaListItem {
  id: string
  name: string
  typeKey: string
  lng: number
  lat: number
  intro: string
}

export interface EncyclopediaDetail extends EncyclopediaListItem {
  address?: string | null
  businessHours?: string | null
  avgPrice?: string | null
  phone?: string | null
  tags: string[]
  /** Ordered media keys; [0] is cover. */
  images: string[]
  coverKey?: string | null
  status?: string
  isFavorited?: boolean
}

export interface BrowseHistoryItem {
  id: string
  name: string
  typeKey: string
  /** Media key for list cover; resolve with fileUrl(). */
  coverKey?: string | null
  intro?: string
  viewedAt: string
}

export interface FavoriteListItem {
  encyclopediaId: string
  name: string
  typeKey: string
  coverKey?: string | null
  intro?: string
  status: string
  favoritedAt: string
}
