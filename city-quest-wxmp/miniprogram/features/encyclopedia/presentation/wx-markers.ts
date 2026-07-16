/**
 * MapMarkerVm + type colors → WeChat <map> markers.
 * Callers: pages/map only (presentation). iconPath injected by page cache.
 *
 * Numeric marker ids are stable per encyclopediaId within a session map
 * (not array index), so selection patches stay correct when list order shifts.
 */

import type { MapMarkerVm } from '../../../core/map/types'
import { markerIconStyle } from './marker-icon-style'
import {
  markerLabelStyle,
  type WxMapMarkerLabel,
} from './marker-label-style'

export type { WxMapMarkerLabel }

/** Disc icons grow from center on select (WeChat default is bottom-center). */
export const MARKER_ICON_ANCHOR = { x: 0.5, y: 0.5 } as const

export interface WxMapMarker {
  id: number
  latitude: number
  longitude: number
  iconPath: string
  width: number
  height: number
  /**
   * Icon anchor on the bitmap (0–1). Center keeps lat/lng under the disc
   * when width/height jump 24 → 32 on selection.
   */
  anchor: { x: number; y: number }
  /** Domain id for navigation */
  encyclopediaId: string
  /** Right-side always-on name chip; omitted when title is empty. */
  label?: WxMapMarkerLabel
}

/**
 * Assigns stable numeric ids for WeChat <map> markerId.
 * Same encyclopediaId always gets the same number once registered.
 */
export function createMarkerIdMap(): {
  idOf: (encyclopediaId: string) => number
  clear: () => void
} {
  const ids = new Map<string, number>()
  let next = 1
  return {
    idOf(encyclopediaId: string): number {
      const existing = ids.get(encyclopediaId)
      if (existing != null) return existing
      const id = next
      next += 1
      ids.set(encyclopediaId, id)
      return id
    },
    clear(): void {
      ids.clear()
      next = 1
    },
  }
}

/**
 * Build wx markers. Numeric id from idOf (stable); encyclopediaId kept for taps.
 * colorOf / iconPathOf are pure injectors (map page supplies type colors + cache).
 */
export function toWxMapMarkers(
  markers: readonly MapMarkerVm[],
  selectedId: string | null | undefined,
  colorOf: (styleKey: string) => string,
  iconPathOf: (color: string, selected: boolean) => string,
  idOf: (encyclopediaId: string) => number = createDefaultIndexIdOf(),
): WxMapMarker[] {
  return markers.map((m) => {
    const selected = selectedId ? m.id === selectedId : Boolean(m.selected)
    const color = colorOf(m.styleKey)
    const style = markerIconStyle(color, selected)
    const label = markerLabelStyle(m.title, color, selected) ?? undefined
    return {
      id: idOf(m.id),
      latitude: m.lat,
      longitude: m.lng,
      iconPath: iconPathOf(color, selected),
      width: style.displaySize,
      height: style.displaySize,
      anchor: { ...MARKER_ICON_ANCHOR },
      encyclopediaId: m.id,
      ...(label ? { label } : {}),
    }
  })
}

/** Fallback when caller omits idOf: first-seen index (legacy tests / one-shots). */
function createDefaultIndexIdOf(): (encyclopediaId: string) => number {
  const ids = new Map<string, number>()
  let index = 0
  return (encyclopediaId: string) => {
    const existing = ids.get(encyclopediaId)
    if (existing != null) return existing
    const id = index
    index += 1
    ids.set(encyclopediaId, id)
    return id
  }
}

/**
 * Unique (color, selected) pairs needed to render markers.
 * Always includes both selected states for each distinct color so selection
 * rebuild can stay synchronous after first warm.
 */
export function collectMarkerIconRequests(
  markers: readonly MapMarkerVm[],
  colorOf: (styleKey: string) => string,
): Array<{ color: string; selected: boolean }> {
  const colors = new Set<string>()
  for (const m of markers) {
    colors.add(colorOf(m.styleKey))
  }
  const requests: Array<{ color: string; selected: boolean }> = []
  for (const color of colors) {
    requests.push({ color, selected: false })
    requests.push({ color, selected: true })
  }
  return requests
}

export interface PatchMarkersSelectionArgs {
  markers: readonly WxMapMarker[]
  prevSelectedId: string | null | undefined
  nextSelectedId: string | null | undefined
  /** encyclopediaId → MapMarkerVm (for styleKey / coords) */
  vmById: ReadonlyMap<string, MapMarkerVm> | Record<string, MapMarkerVm>
  colorOf: (styleKey: string) => string
  iconPathOf: (color: string, selected: boolean) => string
}

export interface PatchMarkersSelectionResult {
  /** Full array for page private cache (immutable copy with patches applied). */
  markers: WxMapMarker[]
  /**
   * setData path patches only — e.g. { 'markers[3]': {...} }.
   * Empty when nothing visible changed.
   */
  setDataPatch: Record<string, WxMapMarker>
}

function lookupVm(
  vmById: ReadonlyMap<string, MapMarkerVm> | Record<string, MapMarkerVm>,
  id: string,
): MapMarkerVm | undefined {
  if (vmById instanceof Map) return vmById.get(id)
  return (vmById as Record<string, MapMarkerVm>)[id]
}

/**
 * Rebuild only markers whose selected style changes (prev and/or next).
 * Avoids full markers[] setData on tap when N is large.
 */
export function patchMarkersSelection(
  args: PatchMarkersSelectionArgs,
): PatchMarkersSelectionResult {
  const prev = args.prevSelectedId || null
  const next = args.nextSelectedId || null
  if (prev === next) {
    return {
      markers: args.markers.map((m) => ({ ...m })),
      setDataPatch: {},
    }
  }

  const touchIds = new Set<string>()
  if (prev) touchIds.add(prev)
  if (next) touchIds.add(next)

  const nextMarkers = args.markers.map((m) => ({ ...m }))
  const setDataPatch: Record<string, WxMapMarker> = {}

  for (let i = 0; i < nextMarkers.length; i += 1) {
    const m = nextMarkers[i]
    if (!touchIds.has(m.encyclopediaId)) continue

    const vm = lookupVm(args.vmById, m.encyclopediaId)
    const styleKey = vm?.styleKey
    if (!styleKey || !vm) continue

    const selected = next != null && m.encyclopediaId === next
    const color = args.colorOf(styleKey)
    const style = markerIconStyle(color, selected)
    const label = markerLabelStyle(vm.title, color, selected)
    // Drop previous label so empty titles don't leave a stale chip via setData.
    const { label: _prevLabel, ...rest } = m
    const patched: WxMapMarker = {
      ...rest,
      iconPath: args.iconPathOf(color, selected),
      width: style.displaySize,
      height: style.displaySize,
      anchor: { ...MARKER_ICON_ANCHOR },
      latitude: vm.lat,
      longitude: vm.lng,
      ...(label ? { label } : {}),
    }
    nextMarkers[i] = patched
    setDataPatch[`markers[${i}]`] = patched
  }

  return { markers: nextMarkers, setDataPatch }
}
