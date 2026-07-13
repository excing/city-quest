/**
 * Callers: map/history/favorites navigateTo.
 * API: GET detail; POST/DELETE favorites; local browse write.
 *
 * State notes:
 * - loadSeq ignores stale fetchDetail responses.
 * - After login return, only refresh isFavorited (no auto-favorite).
 * - Unavailable page can unfavorite when logged in (deep link edge case).
 */
import { ENCYCLOPEDIA_TYPES } from '../../config/encyclopedia-types'
import {
  fetchDetail,
  type EncyclopediaDetail,
} from '../../services/encyclopedia'
import { addFavorite, removeFavorite } from '../../services/favorite'
import { HttpError } from '../../services/http'
import { recordBrowse } from '../../storage/browse-history'
import { isLoggedIn } from '../../stores/session'
import { ensureLoggedIn } from '../../utils/login-guard'
import { colorForType, typeNameForKey } from '../../utils/map'

function normalizeDetail(raw: EncyclopediaDetail): EncyclopediaDetail {
  return {
    ...raw,
    images: Array.isArray(raw.images) ? raw.images : [],
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    address: raw.address ?? null,
    businessHours: raw.businessHours ?? null,
    avgPrice: raw.avgPrice ?? null,
    phone: raw.phone ?? null,
    coverUrl: raw.coverUrl ?? null,
  }
}

Page({
  data: {
    loading: true,
    unavailable: false,
    detail: null as EncyclopediaDetail | null,
    typeName: '',
    typeColor: '#2B4C7E',
    isFavorited: false,
    favLoading: false,
    loggedIn: false,
  },

  encyclopediaId: '',
  loadSeq: 0,

  onLoad(query: Record<string, string | undefined>) {
    const id = query.id
    if (!id) {
      this.setData({ loading: false, unavailable: true, loggedIn: isLoggedIn() })
      return
    }
    this.encyclopediaId = id
    void this.loadDetail(id)
  },

  onShow() {
    this.setData({ loggedIn: isLoggedIn() })
    // Refresh favorite state after returning from login (no auto-favorite)
    if (this.encyclopediaId && !this.data.loading) {
      if (this.data.detail) {
        void this.refreshFavoriteFlag(this.encyclopediaId)
      } else if (this.data.unavailable && isLoggedIn()) {
        // Deep-link unpublished: try to learn favorited flag if API still returns it.
        void this.refreshFavoriteFlag(this.encyclopediaId)
      }
    }
  },

  onShareAppMessage() {
    const detail = this.data.detail as EncyclopediaDetail | null
    if (!detail) {
      return { title: '我的城市探秘', path: '/pages/map/map' }
    }
    const imageUrl =
      detail.coverUrl ||
      (detail.images && detail.images.length > 0 ? detail.images[0] : undefined)
    return {
      title: detail.name,
      path: `/pages/detail/detail?id=${detail.id}`,
      imageUrl: imageUrl || undefined,
    }
  },

  async loadDetail(id: string) {
    const seq = ++this.loadSeq
    this.setData({ loading: true, unavailable: false, loggedIn: isLoggedIn() })
    try {
      const raw = await fetchDetail(id)
      if (seq !== this.loadSeq) {
        return
      }
      const detail = normalizeDetail(raw)
      const types = ENCYCLOPEDIA_TYPES
      this.setData({
        loading: false,
        detail,
        typeName: typeNameForKey(detail.typeKey, types),
        typeColor: colorForType(detail.typeKey, types),
        isFavorited: Boolean(detail.isFavorited),
        loggedIn: isLoggedIn(),
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
      if (seq !== this.loadSeq) {
        return
      }
      if (error instanceof HttpError && error.code === 'NOT_FOUND') {
        this.setData({
          loading: false,
          unavailable: true,
          detail: null,
          loggedIn: isLoggedIn(),
        })
        return
      }
      wx.showToast({
        title: error instanceof HttpError ? error.message : '加载失败',
        icon: 'none',
      })
      this.setData({
        loading: false,
        unavailable: true,
        detail: null,
        loggedIn: isLoggedIn(),
      })
    }
  },

  async refreshFavoriteFlag(id: string) {
    if (!isLoggedIn()) {
      this.setData({ isFavorited: false, loggedIn: false })
      return
    }
    try {
      const detail = await fetchDetail(id)
      if (this.encyclopediaId !== id || this.data.favLoading) {
        return
      }
      this.setData({ isFavorited: Boolean(detail.isFavorited), loggedIn: true })
    } catch (error) {
      if (error instanceof HttpError && (error.status === 401 || error.code === 'UNAUTHORIZED')) {
        this.setData({ isFavorited: false, loggedIn: false })
      }
      // keep last known flag for other errors
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
      this.setData({ favLoading: false, loggedIn: isLoggedIn() })
    }
  },

  async onUnfavoriteUnavailable() {
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
      await removeFavorite(id)
      this.setData({ isFavorited: false })
      wx.showToast({ title: '已取消收藏', icon: 'none' })
    } catch (error) {
      wx.showToast({
        title: error instanceof HttpError ? error.message : '操作失败',
        icon: 'none',
      })
    } finally {
      this.setData({ favLoading: false, loggedIn: isLoggedIn() })
    }
  },

  onOpenMap() {
    const detail = this.data.detail as EncyclopediaDetail | null
    if (!detail || detail.lat == null || detail.lng == null) {
      return
    }
    wx.openLocation({
      latitude: detail.lat,
      longitude: detail.lng,
      name: detail.name,
      address: detail.address || detail.name,
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
