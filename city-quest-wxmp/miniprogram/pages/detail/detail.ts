/**
 * Callers: map/history/favorites navigateTo.
 * API: GET detail; POST/DELETE favorites; local browse write.
 * User: 开始阶段B 和 C, 完成产品闭环.
 */
import fallbackTypes from '../../config/encyclopedia-types.json'
import {
  fetchDetail,
  type EncyclopediaDetail,
  type EncyclopediaType,
} from '../../services/encyclopedia'
import { addFavorite, removeFavorite } from '../../services/favorite'
import { HttpError } from '../../services/http'
import { recordBrowse } from '../../storage/browse-history'
import { isLoggedIn } from '../../stores/session'
import { ensureLoggedIn } from '../../utils/login-guard'
import { colorForType, typeNameForKey } from '../../utils/map'

Page({
  data: {
    loading: true,
    unavailable: false,
    detail: null as EncyclopediaDetail | null,
    typeName: '',
    typeColor: '#2B4C7E',
    isFavorited: false,
    favLoading: false,
  },

  encyclopediaId: '',

  onLoad(query: Record<string, string | undefined>) {
    const id = query.id
    if (!id) {
      this.setData({ loading: false, unavailable: true })
      return
    }
    this.encyclopediaId = id
    void this.loadDetail(id)
  },

  onShow() {
    // Refresh favorite state after returning from login (no auto-favorite)
    if (this.encyclopediaId && !this.data.loading && this.data.detail) {
      void this.refreshFavoriteFlag(this.encyclopediaId)
    }
  },

  onShareAppMessage() {
    const detail = this.data.detail as EncyclopediaDetail | null
    if (!detail) {
      return { title: '我的城市探秘', path: '/pages/map/map' }
    }
    return {
      title: detail.name,
      path: `/pages/detail/detail?id=${detail.id}`,
      imageUrl: detail.coverUrl || undefined,
    }
  },

  async loadDetail(id: string) {
    this.setData({ loading: true, unavailable: false })
    try {
      const detail = await fetchDetail(id)
      const types = fallbackTypes as EncyclopediaType[]
      this.setData({
        loading: false,
        detail,
        typeName: typeNameForKey(detail.typeKey, types),
        typeColor: colorForType(detail.typeKey, types),
        isFavorited: Boolean(detail.isFavorited),
      })
      wx.setNavigationBarTitle({ title: detail.name })
      recordBrowse({
        id: detail.id,
        name: detail.name,
        typeKey: detail.typeKey,
        coverUrl: detail.coverUrl,
        intro: detail.intro,
      })
    } catch (error) {
      if (error instanceof HttpError && error.code === 'NOT_FOUND') {
        this.setData({ loading: false, unavailable: true, detail: null })
        return
      }
      wx.showToast({
        title: error instanceof HttpError ? error.message : '加载失败',
        icon: 'none',
      })
      this.setData({ loading: false, unavailable: true, detail: null })
    }
  },

  async refreshFavoriteFlag(id: string) {
    if (!isLoggedIn()) {
      this.setData({ isFavorited: false })
      return
    }
    try {
      const detail = await fetchDetail(id)
      this.setData({ isFavorited: Boolean(detail.isFavorited) })
    } catch {
      // ignore
    }
  },

  async onToggleFavorite() {
    if (this.data.favLoading) {
      return
    }
    if (!ensureLoggedIn()) {
      return
    }
    const id = this.encyclopediaId
    if (!id) {
      return
    }
    this.setData({ favLoading: true })
    try {
      if (this.data.isFavorited) {
        await removeFavorite(id)
        this.setData({ isFavorited: false })
        wx.showToast({ title: '已取消收藏', icon: 'none' })
      } else {
        await addFavorite(id)
        this.setData({ isFavorited: true })
        wx.showToast({ title: '已收藏', icon: 'none' })
      }
    } catch (error) {
      wx.showToast({
        title: error instanceof HttpError ? error.message : '操作失败',
        icon: 'none',
      })
    } finally {
      this.setData({ favLoading: false })
    }
  },

  onOpenMap() {
    const detail = this.data.detail as EncyclopediaDetail | null
    if (!detail || !detail.address) {
      return
    }
    wx.openLocation({
      latitude: detail.lat,
      longitude: detail.lng,
      name: detail.name,
      address: detail.address,
      scale: 16,
    })
  },

  onCall() {
    const detail = this.data.detail as EncyclopediaDetail | null
    if (!detail?.phone) {
      return
    }
    wx.makePhoneCall({ phoneNumber: detail.phone })
  },

  onBackHome() {
    wx.switchTab({ url: '/pages/map/map' })
  },
})
