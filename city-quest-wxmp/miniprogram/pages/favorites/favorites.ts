/**
 * Callers: mine → favorites (login only).
 * API: GET /me/favorites; DELETE for unpublished unfavorite.
 * User: 开始阶段B 和 C, 完成产品闭环.
 */
import fallbackTypes from '../../config/encyclopedia-types.json'
import type { EncyclopediaType } from '../../services/encyclopedia'
import {
  fetchFavorites,
  removeFavorite,
  type FavoriteItem,
} from '../../services/favorite'
import { HttpError } from '../../services/http'
import { isLoggedIn } from '../../stores/session'
import { colorForType, typeNameForKey } from '../../utils/map'

interface FavoriteRow extends FavoriteItem {
  typeName: string
  typeColor: string
}

Page({
  data: {
    loading: true,
    items: [] as FavoriteRow[],
  },

  onShow() {
    if (!isLoggedIn()) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      setTimeout(() => {
        wx.redirectTo({ url: '/pages/login/login' })
      }, 300)
      return
    }
    void this.load()
  },

  async load() {
    this.setData({ loading: true })
    try {
      const list = await fetchFavorites()
      const types = fallbackTypes as EncyclopediaType[]
      const items: FavoriteRow[] = list.map((item) => ({
        ...item,
        typeName: typeNameForKey(item.typeKey, types),
        typeColor: colorForType(item.typeKey, types),
      }))
      this.setData({ items, loading: false })
    } catch (error) {
      this.setData({ loading: false, items: [] })
      wx.showToast({
        title: error instanceof HttpError ? error.message : '加载失败',
        icon: 'none',
      })
    }
  },

  onOpenDetail(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as string
    const status = e.currentTarget.dataset.status as string
    if (!id) {
      return
    }
    if (status !== 'published') {
      wx.showToast({ title: '该地点已下架，暂时无法查看', icon: 'none' })
      return
    }
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` })
  },

  async onUnfavorite(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as string
    if (!id) {
      return
    }
    try {
      await removeFavorite(id)
      wx.showToast({ title: '已取消收藏', icon: 'none' })
      void this.load()
    } catch (error) {
      wx.showToast({
        title: error instanceof HttpError ? error.message : '操作失败',
        icon: 'none',
      })
    }
  },

  onGoMap() {
    wx.switchTab({ url: '/pages/map/map' })
  },
})
