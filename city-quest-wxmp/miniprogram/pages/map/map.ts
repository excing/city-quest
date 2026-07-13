/**
 * Callers: Tab 首页 map via app.json.
 * API: static /config/encyclopedia-types.json + GET /public/encyclopedias
 *
 * State notes:
 * - First load fits include-points; tab return soft-refreshes without wiping pan/selection.
 * - loadSeq guards against stale async setData races.
 */
import { ENCYCLOPEDIA_TYPES } from '../../config/encyclopedia-types'
import {
  fetchPublishedList,
  fetchTypes,
  type EncyclopediaMapItem,
  type EncyclopediaType,
} from '../../services/encyclopedia'
import { HttpError } from '../../services/http'
import {
  buildIncludePoints,
  buildMarkers,
  DALI_CENTER,
  DEFAULT_SCALE,
  typeNameForKey,
  colorForType,
  type MapMarker,
} from '../../utils/map'

interface SelectedPreview {
  id: string
  name: string
  intro: string
  typeName: string
  typeColor: string
}

Page({
  data: {
    longitude: DALI_CENTER.longitude,
    latitude: DALI_CENTER.latitude,
    scale: DEFAULT_SCALE,
    markers: [] as MapMarker[],
    includePoints: [] as Array<{ longitude: number; latitude: number }>,
    items: [] as EncyclopediaMapItem[],
    types: ENCYCLOPEDIA_TYPES,
    selected: null as SelectedPreview | null,
    loading: true,
    errorMessage: '',
    showLegend: true,
  },

  markerIndexById: {} as Record<number, string>,
  /** Incremented per load to ignore stale async responses. */
  loadSeq: 0,
  /** True after first successful load; avoids wiping pan/zoom/selection on tab return. */
  hasLoadedOnce: false,
  loadingInFlight: false,
  /** Last successful list load timestamp (ms). Soft refresh throttled. */
  lastLoadedAt: 0,
  /** Ignore blank-map taps shortly after markertap (both can fire on some devices). */
  ignoreMapTapUntil: 0,

  onLoad() {
    void this.loadData({ reason: 'init' })
  },

  onShow() {
    if (this.loadingInFlight) {
      return
    }
    // First load still pending is handled by onLoad; only retry after a failed first load.
    if (!this.hasLoadedOnce) {
      if (this.loadSeq === 0) {
        // onShow before onLoad finished scheduling (rare); start init load.
        void this.loadData({ reason: 'init', preserveViewport: false })
      } else {
        void this.loadData({ reason: 'show', preserveViewport: false })
      }
      return
    }
    // Soft refresh at most every 60s when returning to tab; keep viewport + selection.
    const STALE_MS = 60_000
    if (Date.now() - this.lastLoadedAt > STALE_MS) {
      void this.loadData({ reason: 'show', preserveViewport: true })
    }
  },

  async loadData(options: {
    reason: 'init' | 'show' | 'retry'
    preserveViewport?: boolean
  }) {
    const preserveViewport = Boolean(options.preserveViewport)
    const seq = ++this.loadSeq
    this.loadingInFlight = true

    // Soft refresh: no full-screen loading banner that flickers every tab switch.
    if (!preserveViewport || !this.hasLoadedOnce) {
      this.setData({ loading: true, errorMessage: '' })
    } else {
      this.setData({ errorMessage: '' })
    }

    try {
      let types = ENCYCLOPEDIA_TYPES
      try {
        types = await fetchTypes()
      } catch {
        types = ENCYCLOPEDIA_TYPES
      }

      const items = await fetchPublishedList()
      if (seq !== this.loadSeq) {
        return
      }

      const selectedId =
        preserveViewport && this.data.selected
          ? (this.data.selected as SelectedPreview).id
          : null
      // Drop selection if the point disappeared (unpublished).
      const stillExists =
        selectedId != null && items.some((it) => it.id === selectedId)
      const nextSelectedId = stillExists ? selectedId : null

      const markers = buildMarkers(items, types, nextSelectedId)
      const includePoints = buildIncludePoints(items)

      const markerIndexById: Record<number, string> = {}
      markers.forEach((m) => {
        markerIndexById[m.id] = m.encyclopediaId
      })
      this.markerIndexById = markerIndexById

      let selected: SelectedPreview | null = null
      if (nextSelectedId) {
        const item = items.find((it) => it.id === nextSelectedId)
        if (item) {
          selected = {
            id: item.id,
            name: item.name,
            intro: item.intro,
            typeName: typeNameForKey(item.typeKey, types),
            typeColor: colorForType(item.typeKey, types),
          }
        }
      }

      const patch: WechatMiniprogram.IAnyObject = {
        types,
        items,
        markers,
        selected,
        loading: false,
        errorMessage: '',
      }

      // Only fit bounds on first load / explicit retry — not every tab return.
      if (!preserveViewport || !this.hasLoadedOnce) {
        patch.includePoints =
          includePoints.length > 0
            ? includePoints
            : [
                {
                  longitude: DALI_CENTER.longitude,
                  latitude: DALI_CENTER.latitude,
                },
              ]
        patch.longitude = DALI_CENTER.longitude
        patch.latitude = DALI_CENTER.latitude
        patch.scale = DEFAULT_SCALE
      }

      this.setData(patch)
      this.hasLoadedOnce = true
      this.lastLoadedAt = Date.now()
    } catch (error) {
      if (seq !== this.loadSeq) {
        return
      }
      const message =
        error instanceof HttpError ? error.message : '点位加载失败，点击重试'
      this.setData({
        loading: false,
        errorMessage:
          message === '网络异常，请检查网络后重试'
            ? '点位加载失败，点击重试'
            : message,
        // Keep previous markers on soft-refresh failure so UI does not blank out.
        ...(preserveViewport && this.hasLoadedOnce
          ? {}
          : {
              markers: [],
              items: [],
              selected: null,
            }),
      })
    } finally {
      if (seq === this.loadSeq) {
        this.loadingInFlight = false
      }
    }
  },

  onRetry() {
    void this.loadData({ reason: 'retry', preserveViewport: false })
  },

  onMarkerTap(e: WechatMiniprogram.MarkerTap) {
    // bindtap often also fires after markertap; suppress blank-map dismiss briefly.
    this.ignoreMapTapUntil = Date.now() + 350
    const markerId = e.detail.markerId
    const encyclopediaId = this.markerIndexById[markerId]
    if (!encyclopediaId) {
      return
    }
    const item = (this.data.items as EncyclopediaMapItem[]).find(
      (it) => it.id === encyclopediaId,
    )
    if (!item) {
      return
    }
    const types = this.data.types as EncyclopediaType[]
    const selected: SelectedPreview = {
      id: item.id,
      name: item.name,
      intro: item.intro,
      typeName: typeNameForKey(item.typeKey, types),
      typeColor: colorForType(item.typeKey, types),
    }
    const markers = buildMarkers(
      this.data.items as EncyclopediaMapItem[],
      types,
      item.id,
    )
    this.setData({ selected, markers })
  },

  onMapTap() {
    if (Date.now() < this.ignoreMapTapUntil) {
      return
    }
    if (!this.data.selected) {
      return
    }
    const types = this.data.types as EncyclopediaType[]
    const markers = buildMarkers(
      this.data.items as EncyclopediaMapItem[],
      types,
      null,
    )
    this.setData({ selected: null, markers })
  },

  onOpenDetail(e: WechatMiniprogram.CustomEvent<{ id: string }>) {
    const id = e.detail.id
    if (!id) {
      return
    }
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` })
  },

  onDismissLegend() {
    this.setData({ showLegend: false })
  },
})
