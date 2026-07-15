/**
 * Home map — full published markers + preview card (Phase 3).
 * Callers: WeChat router (tab).
 * Markers: canvas-generated colored discs (cached by type color).
 *
 * Load strategy (architecture §9 + perf plan):
 * - First visit: full reload + one-shot includePoints fit.
 * - Later onShow: soft refresh (repo TTL cache, no loading banner, keep viewport).
 * - Icons: two-phase — paint with cached/fallback paths, then ensureAll + patch.
 */

import { getAppContext } from '../../app-context'
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_SCALE } from '../../core/config/constants'
import { messageFromUnknown } from '../../core/error/messages'
import type { MapMarkerVm } from '../../core/map/types'
import { navigateTo } from '../../core/navigation/nav'
import type {
  EncyclopediaListItem,
  LoadMapPointsResult,
} from '../../features/encyclopedia/public'
import {
  buildTypeMap,
  collectMarkerIconRequests,
  createMarkerIconService,
  detailUrl,
  FALLBACK_MARKER_ICON,
  toWxMapMarkers,
  typeNameOf,
  typeColorOf,
  type MarkerIconService,
  type WxMapMarker,
} from '../../features/encyclopedia/public'
import { createLoadSeq } from '../../shared/lib/load-seq'

const loadSeq = createLoadSeq()

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
  _typeMap: {} as Record<string, { key: string; name: string; color: string }>,
  _wxMarkers: [] as WxMapMarker[],
  _iconService: null as MarkerIconService | null,
  /** True after the first successful paint with data (or empty). */
  _hasLoadedOnce: false,
  /** Only apply includePoints / center fit once so user pan/zoom is kept. */
  _didFitViewport: false,

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
    this._typeMap = typeMap
    getAppContext().setEncyclopediaTypes(result.types)

    const colorOf = (styleKey: string) => typeColorOf(styleKey, typeMap)
    const selectedId = this.data.selectedId || null

    // Phase 1: paint immediately with cached icon paths or fallback.
    const phase1 = toWxMapMarkers(
      result.markers,
      selectedId,
      colorOf,
      (color, selected) =>
        this.iconService().pathOf(color, selected) ?? FALLBACK_MARKER_ICON,
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

    const phase2 = toWxMapMarkers(
      result.markers,
      this.data.selectedId || null,
      colorOf,
      (color, selected) =>
        this.iconService().pathOf(color, selected) ?? FALLBACK_MARKER_ICON,
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

  rebuildMarkers(selectedId: string | null) {
    const source: MapMarkerVm[] =
      this._markersVm.length > 0
        ? this._markersVm.map((m) => ({
            ...m,
            selected: selectedId ? m.id === selectedId : false,
          }))
        : this._items.map((item) => ({
            id: item.id,
            lng: item.lng,
            lat: item.lat,
            styleKey: item.typeKey,
            title: item.name,
            selected: selectedId ? item.id === selectedId : false,
          }))

    const wxMarkers = toWxMapMarkers(
      source,
      selectedId,
      (styleKey) => this.colorOf(styleKey),
      (color, selected) => this.iconPathOf(color, selected),
    )
    this._wxMarkers = wxMarkers
    this._markersVm = source
    return wxMarkers
  },

  onMarkerTap(e: WechatMiniprogram.MarkerTap) {
    const markerId = e.detail.markerId
    const hit = this._wxMarkers.find((m) => m.id === markerId)
    if (!hit) return
    const selectedId = hit.encyclopediaId
    const preview = this.buildPreview(selectedId)
    this.setData({
      selectedId,
      preview,
      markers: this.rebuildMarkers(selectedId),
    })
  },

  onMapTap() {
    if (!this.data.selectedId && !this.data.preview) return
    this.setData({
      selectedId: '',
      preview: null,
      markers: this.rebuildMarkers(null),
    })
  },

  onOpenDetail() {
    const id = this.data.preview?.id
    if (!id) return
    navigateTo(detailUrl(id))
  },

  onRetry() {
    void this.reload({ soft: false, forceRefresh: true })
  },
})
