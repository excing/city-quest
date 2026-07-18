/**
 * Home map — full published markers + preview card (Phase 3).
 * Callers: WeChat router (tab).
 * Markers: canvas-generated colored discs (cached by type color).
 *
 * Load strategy (architecture §9 + perf plan):
 * - First visit: full reload + one-shot includePoints fit.
 * - Later onShow: soft refresh (repo TTL cache, no loading banner, keep viewport).
 * - Icons: two-phase — paint with cached/fallback paths, then ensureAll + patch.
 * - Selection: path-style setData on changed markers only (Sprint B).
 */

import { getAppContext } from '../../app-context'
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_SCALE } from '../../core/config/constants'
import { messageFromUnknown } from '../../core/error/messages'
import type { MapMarkerVm } from '../../core/map/types'
import { viewportForPoint } from '../../core/map/viewport'
import { navigateTo } from '../../core/navigation/nav'
import type {
  EncyclopediaListItem,
  LoadMapPointsResult,
} from '../../features/encyclopedia/public'
import {
  buildTypeMap,
  collectMarkerIconRequests,
  createMarkerIconService,
  createMarkerIdMap,
  detailUrl,
  FALLBACK_MARKER_ICON,
  patchMarkersSelection,
  toWxMapMarkers,
  typeNameOf,
  typeColorOf,
  type MarkerIconService,
  type WxMapMarker,
} from '../../features/encyclopedia/public'
import { createLoadSeq } from '../../shared/lib/load-seq'

const loadSeq = createLoadSeq()

/** Swallow map tap that WeChat often fires immediately after markertap. */
const MAP_TAP_GUARD_MS = 150

interface PreviewCard {
  id: string
  name: string
  intro: string
  typeName: string
  typeColor: string
}

Page({
  data: {
    longitude: DEFAULT_MAP_CENTER.lng,
    latitude: DEFAULT_MAP_CENTER.lat,
    scale: DEFAULT_MAP_SCALE,
    includePoints: [] as Array<{ longitude: number; latitude: number }>,
    markers: [] as WxMapMarker[],
    selectedId: '' as string,
    preview: null as PreviewCard | null,
    loading: true,
    error: '',
    empty: false,
  },

  _items: [] as EncyclopediaListItem[],
  _markersVm: [] as MapMarkerVm[],
  _vmById: {} as Record<string, MapMarkerVm>,
  _typeMap: {} as Record<string, { key: string; name: string; color: string }>,
  _wxMarkers: [] as WxMapMarker[],
  _iconService: null as MarkerIconService | null,
  _markerIds: createMarkerIdMap(),
  /** True after the first successful paint with data (or empty). */
  _hasLoadedOnce: false,
  /** Only apply includePoints / center fit once so user pan/zoom is kept. */
  _didFitViewport: false,
  /** Ignore bindtap until this timestamp (ms) after a successful markertap. */
  _ignoreMapTapUntil: 0 as number,

  onShow() {
    if (this._hasLoadedOnce) {
      void this.reload({ soft: true })
    } else {
      void this.reload({ soft: false })
    }
  },

  iconService(): MarkerIconService {
    if (!this._iconService) {
      this._iconService = createMarkerIconService()
    }
    return this._iconService
  },

  colorOf(styleKey: string): string {
    return typeColorOf(styleKey, this._typeMap)
  },

  iconPathOf(color: string, selected: boolean): string {
    return this.iconService().pathOf(color, selected) ?? FALLBACK_MARKER_ICON
  },

  idOf(encyclopediaId: string): number {
    return this._markerIds.idOf(encyclopediaId)
  },

  buildVmById(markers: readonly MapMarkerVm[]): Record<string, MapMarkerVm> {
    const map: Record<string, MapMarkerVm> = {}
    for (const m of markers) {
      map[m.id] = m
    }
    return map
  },

  async reload(opts?: { soft?: boolean; forceRefresh?: boolean }) {
    const soft = Boolean(opts?.soft)
    const forceRefresh = Boolean(opts?.forceRefresh)
    const seq = loadSeq.next()

    if (!soft) {
      this.setData({ loading: true, error: '' })
    }

    try {
      const result = await getAppContext().loadMapPoints({
        selectedId: this.data.selectedId || null,
        forceRefresh,
      })
      if (!loadSeq.isCurrent(seq)) return

      await this.applyLoadResult(result, seq)
    } catch (e) {
      if (!loadSeq.isCurrent(seq)) return
      // Soft refresh keeps last good map; hard reload shows error chrome.
      if (soft && this._hasLoadedOnce) {
        void messageFromUnknown(e)
        return
      }
      this.setData({
        loading: false,
        error: '点位加载失败，点击重试',
        empty: false,
        markers: [],
        includePoints: [],
        longitude: DEFAULT_MAP_CENTER.lng,
        latitude: DEFAULT_MAP_CENTER.lat,
        scale: DEFAULT_MAP_SCALE,
      })
      void messageFromUnknown(e)
    }
  },

  async applyLoadResult(result: LoadMapPointsResult, seq: number) {
    const typeMap = buildTypeMap(result.types)
    this._items = result.items
    this._markersVm = result.markers
    this._vmById = this.buildVmById(result.markers)
    this._typeMap = typeMap
    getAppContext().setEncyclopediaTypes(result.types)

    const colorOf = (styleKey: string) => typeColorOf(styleKey, typeMap)
    const selectedId = this.data.selectedId || null
    const idOf = (encyclopediaId: string) => this.idOf(encyclopediaId)

    // Phase 1: paint immediately with cached icon paths or fallback.
    const phase1 = toWxMapMarkers(
      result.markers,
      selectedId,
      colorOf,
      (color, selected) =>
        this.iconService().pathOf(color, selected) ?? FALLBACK_MARKER_ICON,
      idOf,
    )
    this._wxMarkers = phase1

    const patch: WechatMiniprogram.IAnyObject = {
      loading: false,
      error: '',
      empty: result.items.length === 0,
      markers: phase1,
    }

    // First successful load only: fit all markers once.
    if (!this._didFitViewport) {
      const includePoints =
        result.viewport.includePoints?.map((p) => ({
          longitude: p.lng,
          latitude: p.lat,
        })) ?? []
      patch.includePoints = includePoints
      const center = result.viewport.center
      if (center) {
        patch.longitude = center.lng
        patch.latitude = center.lat
      }
      if (result.viewport.scale != null) {
        patch.scale = result.viewport.scale
      }
      this._didFitViewport = true
    }

    if (selectedId) {
      const preview = this.buildPreview(selectedId)
      if (preview) {
        patch.preview = preview
      } else {
        patch.selectedId = ''
        patch.preview = null
      }
    }

    this.setData(patch)
    this._hasLoadedOnce = true

    // Phase 2: warm missing icons, then patch paths (keep viewport).
    const requests = collectMarkerIconRequests(result.markers, colorOf)
    await this.iconService().ensureAll(requests)
    if (!loadSeq.isCurrent(seq)) return

    // Keep current selection (user may have tapped during ensureAll).
    const phase2 = toWxMapMarkers(
      result.markers,
      this.data.selectedId || null,
      colorOf,
      (color, selected) =>
        this.iconService().pathOf(color, selected) ?? FALLBACK_MARKER_ICON,
      idOf,
    )
    this._wxMarkers = phase2
    this.setData({ markers: phase2 })
  },

  buildPreview(id: string): PreviewCard | null {
    const item = this._items.find((x) => x.id === id)
    if (!item) return null
    return {
      id: item.id,
      name: item.name,
      intro: item.intro,
      typeName: typeNameOf(item.typeKey, this._typeMap),
      typeColor: typeColorOf(item.typeKey, this._typeMap),
    }
  },

  /**
   * Selection change: only setData the 1–2 markers whose style changes.
   */
  applySelection(nextSelectedId: string | null) {
    const prevSelectedId = this.data.selectedId || null
    const { markers, setDataPatch } = patchMarkersSelection({
      markers: this._wxMarkers,
      prevSelectedId,
      nextSelectedId,
      vmById: this._vmById,
      colorOf: (styleKey) => this.colorOf(styleKey),
      iconPathOf: (color, selected) => this.iconPathOf(color, selected),
    })
    this._wxMarkers = markers
    this._markersVm = this._markersVm.map((m) => ({
      ...m,
      selected: nextSelectedId ? m.id === nextSelectedId : false,
    }))

    const preview = nextSelectedId ? this.buildPreview(nextSelectedId) : null
    const data: WechatMiniprogram.IAnyObject = {
      ...setDataPatch,
      selectedId: nextSelectedId || '',
      preview,
    }
    this.setData(data)
  },

  /**
   * Icon (markertap) and name chip (labeltap) share the same detail shape:
   * { markerId }. Both select the encyclopedia point.
   */
  onMarkerTap(e: WechatMiniprogram.MarkerTap | WechatMiniprogram.LabelTap) {
    const markerId = e.detail.markerId
    const hit = this._wxMarkers.find((m) => m.id === markerId)
    if (!hit) return
    this.applySelection(hit.encyclopediaId)
    // WeChat often fires bindtap right after markertap/labeltap; block blank-map clear briefly.
    this._ignoreMapTapUntil = Date.now() + MAP_TAP_GUARD_MS
  },

  onMapTap() {
    if (Date.now() < this._ignoreMapTapUntil) return
    if (!this.data.selectedId && !this.data.preview) return
    this.applySelection(null)
  },

  onOpenDetail() {
    const id = this.data.preview?.id
    if (!id) return
    navigateTo(detailUrl(id))
  },

  /**
   * "定位到这里": center map on the selected encyclopedia and zoom in.
   * Clears includePoints so a previous multi-point fit does not fight the center.
   */
  onLocateHere() {
    const id = this.data.preview?.id
    if (!id) return
    const vm = this._vmById[id]
    if (!vm) return

    const viewport = viewportForPoint({ lng: vm.lng, lat: vm.lat })
    const center = viewport.center
    if (!center || viewport.scale == null) return

    this.setData({
      longitude: center.lng,
      latitude: center.lat,
      scale: viewport.scale,
      // Clear multi-point fit so center/scale take effect after first load.
      includePoints: [],
    })
  },

  onRetry() {
    void this.reload({ soft: false, forceRefresh: true })
  },
})
