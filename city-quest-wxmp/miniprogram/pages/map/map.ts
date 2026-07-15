/**
 * Home map — full published markers + preview card (Phase 3).
 * Callers: WeChat router (tab).
 * Markers: canvas-generated colored discs (cached by type color).
 */

import { getAppContext } from '../../app-context'
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_SCALE } from '../../core/config/constants'
import { messageFromUnknown } from '../../core/error/messages'
import { navigateTo } from '../../core/navigation/nav'
import type { EncyclopediaListItem } from '../../features/encyclopedia/public'
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
  _typeMap: {} as Record<string, { key: string; name: string; color: string }>,
  _wxMarkers: [] as WxMapMarker[],
  _iconService: null as MarkerIconService | null,

  onShow() {
    void this.reload()
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

  async reload() {
    const seq = loadSeq.next()
    this.setData({ loading: true, error: '' })
    try {
      const result = await getAppContext().loadMapPoints(this.data.selectedId || null)
      if (!loadSeq.isCurrent(seq)) return

      const typeMap = buildTypeMap(result.types)
      this._items = result.items
      this._typeMap = typeMap

      const colorOf = (styleKey: string) => typeColorOf(styleKey, typeMap)
      const requests = collectMarkerIconRequests(result.markers, colorOf)
      await this.iconService().ensureAll(requests)
      if (!loadSeq.isCurrent(seq)) return

      const wxMarkers = toWxMapMarkers(
        result.markers,
        this.data.selectedId || null,
        colorOf,
        (color, selected) =>
          this.iconService().pathOf(color, selected) ?? FALLBACK_MARKER_ICON,
      )
      this._wxMarkers = wxMarkers

      const includePoints =
        result.viewport.includePoints?.map((p) => ({
          longitude: p.lng,
          latitude: p.lat,
        })) ?? []

      const center = result.viewport.center
      const patch: WechatMiniprogram.IAnyObject = {
        loading: false,
        error: '',
        empty: result.items.length === 0,
        markers: wxMarkers,
        includePoints,
      }
      if (center) {
        patch.longitude = center.lng
        patch.latitude = center.lat
      }
      if (result.viewport.scale != null) {
        patch.scale = result.viewport.scale
      }
      if (this.data.selectedId) {
        const preview = this.buildPreview(this.data.selectedId)
        if (preview) {
          patch.preview = preview
        } else {
          patch.selectedId = ''
          patch.preview = null
        }
      }
      this.setData(patch)
    } catch (e) {
      if (!loadSeq.isCurrent(seq)) return
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
    const wxMarkers = toWxMapMarkers(
      this._items.map((item) => ({
        id: item.id,
        lng: item.lng,
        lat: item.lat,
        styleKey: item.typeKey,
        title: item.name,
        selected: selectedId ? item.id === selectedId : false,
      })),
      selectedId,
      (styleKey) => this.colorOf(styleKey),
      (color, selected) => this.iconPathOf(color, selected),
    )
    this._wxMarkers = wxMarkers
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
    void this.reload()
  },
})
