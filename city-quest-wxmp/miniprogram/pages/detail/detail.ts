/**
 * Encyclopedia detail — gallery, meta, favorite, share (Phase 3).
 * Callers: WeChat router (main package, share cold start).
 */

import { getAppContext } from '../../app-context'
import { messageFromUnknown, isHttpError } from '../../core/error/messages'
import { switchTab } from '../../core/navigation/nav'
import type { EncyclopediaDetail } from '../../features/encyclopedia/public'
import {
  buildTypeMap,
  EncyclopediaRoutes,
  typeColorOf,
  typeNameOf,
} from '../../features/encyclopedia/public'

interface DetailVm {
  id: string
  name: string
  intro: string
  typeName: string
  typeColor: string
  tags: string[]
  images: string[]
  address: string
  businessHours: string
  avgPrice: string
  phone: string
  hasImages: boolean
  hasAddress: boolean
  hasBusinessHours: boolean
  hasAvgPrice: boolean
  hasPhone: boolean
  hasTags: boolean
  isFavorited: boolean
  lng: number
  lat: number
}

function toVm(
  detail: EncyclopediaDetail,
  typeMap: Record<string, { key: string; name: string; color: string }>,
): DetailVm {
  const images =
    detail.images?.length > 0
      ? detail.images
      : detail.imageUrls?.length
        ? detail.imageUrls
        : detail.coverUrl
          ? [detail.coverUrl]
          : []
  const address = detail.address?.trim() || ''
  const businessHours = detail.businessHours?.trim() || ''
  const avgPrice = detail.avgPrice?.trim() || ''
  const phone = detail.phone?.trim() || ''
  const tags = (detail.tags || []).filter(Boolean)
  return {
    id: detail.id,
    name: detail.name,
    intro: detail.intro,
    typeName: typeNameOf(detail.typeKey, typeMap),
    typeColor: typeColorOf(detail.typeKey, typeMap),
    tags,
    images,
    address,
    businessHours,
    avgPrice,
    phone,
    hasImages: images.length > 0,
    hasAddress: Boolean(address),
    hasBusinessHours: Boolean(businessHours),
    hasAvgPrice: Boolean(avgPrice),
    hasPhone: Boolean(phone),
    hasTags: tags.length > 0,
    isFavorited: Boolean(detail.isFavorited),
    lng: detail.lng,
    lat: detail.lat,
  }
}

Page({
  data: {
    id: '',
    loading: true,
    error: '',
    unavailable: false,
    favoriting: false,
    detail: null as DetailVm | null,
    shareTitle: '我的城市探秘',
    shareImageUrl: '',
  },

  onLoad(query: Record<string, string | undefined>) {
    const id = query.id || ''
    this.setData({ id })
    if (!id) {
      this.setData({ loading: false, unavailable: true, error: '缺少百科 id' })
      return
    }
    void this.load(id)
  },

  onShow() {
    const id = this.data.id
    if (id && !this.data.loading && this.data.detail && !this.data.unavailable) {
      void this.refreshFavoriteOnly(id)
    }
  },

  async load(id: string) {
    this.setData({ loading: true, error: '', unavailable: false })
    try {
      const detail = await getAppContext().openDetail(id)
      const typeMap = buildTypeMap([])
      const vm = toVm(detail, typeMap)
      this.setData({
        loading: false,
        detail: vm,
        shareTitle: vm.name,
        shareImageUrl: vm.images[0] || '',
      })
    } catch (e) {
      const unavailable = isHttpError(e) && (e.status === 404 || e.code === 'NOT_FOUND')
      this.setData({
        loading: false,
        unavailable: true,
        error: unavailable
          ? '该地点已下架，暂时无法查看'
          : messageFromUnknown(e),
        detail: null,
      })
    }
  },

  async refreshFavoriteOnly(id: string) {
    try {
      const detail = await getAppContext().openDetail(id)
      if (!this.data.detail) return
      this.setData({
        'detail.isFavorited': Boolean(detail.isFavorited),
      })
    } catch {
      // soft refresh: ignore
    }
  },

  async onToggleFavorite() {
    const detail = this.data.detail
    if (!detail || this.data.favoriting) return

    const ctx = getAppContext()
    const ok = await ctx.ensureAuthenticated({
      currentPath: EncyclopediaRoutes.detail,
      query: { id: detail.id },
    })
    if (!ok) return

    this.setData({ favoriting: true })
    try {
      if (detail.isFavorited) {
        await ctx.removeFavorite(detail.id)
        this.setData({ 'detail.isFavorited': false, favoriting: false })
        wx.showToast({ title: '已取消收藏', icon: 'none' })
      } else {
        await ctx.addFavorite(detail.id)
        this.setData({ 'detail.isFavorited': true, favoriting: false })
        wx.showToast({ title: '已收藏', icon: 'none' })
      }
    } catch (e) {
      this.setData({ favoriting: false })
      wx.showToast({ title: messageFromUnknown(e), icon: 'none' })
    }
  },

  onOpenMap() {
    const d = this.data.detail
    if (!d) return
    if (!d.hasAddress && !(d.lng && d.lat)) return
    wx.openLocation({
      latitude: d.lat,
      longitude: d.lng,
      name: d.name,
      address: d.address || d.name,
      scale: 16,
    })
  },

  onCall() {
    const phone = this.data.detail?.phone
    if (!phone) return
    wx.makePhoneCall({ phoneNumber: phone })
  },

  onBackHome() {
    switchTab(EncyclopediaRoutes.map)
  },

  onShareAppMessage() {
    const d = this.data.detail
    return {
      title: d?.name || this.data.shareTitle,
      path: d
        ? `/pages/detail/detail?id=${encodeURIComponent(d.id)}`
        : '/pages/map/map',
      imageUrl: d?.images[0] || this.data.shareImageUrl || undefined,
    }
  },
})
