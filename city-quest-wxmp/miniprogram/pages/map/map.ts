/**
 * Callers: Tab 首页 map via app.json.
 * API: GET /public/types + /public/encyclopedias
 * User: 阅读 @docs , 然后选择合适的agents或skills, 开始进行开发.
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
  },

  markerIndexById: {} as Record<number, string>,

  onShow() {
    void this.loadData()
  },

  async loadData() {
    this.setData({ loading: true, errorMessage: '' })
    try {
      let types = ENCYCLOPEDIA_TYPES
      try {
        types = await fetchTypes()
      } catch {
        types = ENCYCLOPEDIA_TYPES
      }

      const items = await fetchPublishedList()
      const markers = buildMarkers(items, types)
      const includePoints = buildIncludePoints(items)

      const markerIndexById: Record<number, string> = {}
      markers.forEach((m) => {
        markerIndexById[m.id] = m.encyclopediaId
      })
      this.markerIndexById = markerIndexById

      this.setData({
        types,
        items,
        markers,
        includePoints:
          includePoints.length > 0
            ? includePoints
            : [
                {
                  longitude: DALI_CENTER.longitude,
                  latitude: DALI_CENTER.latitude,
                },
              ],
        selected: null,
        loading: false,
        errorMessage: '',
        longitude: DALI_CENTER.longitude,
        latitude: DALI_CENTER.latitude,
        scale: DEFAULT_SCALE,
      })
    } catch (error) {
      const message =
        error instanceof HttpError ? error.message : '点位加载失败，点击重试'
      this.setData({
        loading: false,
        errorMessage:
          message === '网络异常，请检查网络后重试'
            ? '点位加载失败，点击重试'
            : message,
        markers: [],
        items: [],
        selected: null,
      })
    }
  },

  onRetry() {
    void this.loadData()
  },

  onMarkerTap(e: WechatMiniprogram.MapMarkerTap) {
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
    this.setData({
      selected: {
        id: item.id,
        name: item.name,
        intro: item.intro,
        typeName: typeNameForKey(item.typeKey, types),
        typeColor: colorForType(item.typeKey, types),
      },
    })
  },

  onMapTap() {
    if (this.data.selected) {
      this.setData({ selected: null })
    }
  },

  onOpenDetail(e: WechatMiniprogram.CustomEvent<{ id: string }>) {
    const id = e.detail.id
    if (!id) {
      return
    }
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` })
  },
})
