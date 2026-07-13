/**
 * Callers: mine → favorites (login only).
 * API: GET /me/favorites; DELETE unfavorite (published + unpublished).
 */
import { ENCYCLOPEDIA_TYPES } from '../../config/encyclopedia-types'
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
    unfavId: '' as string,
  },

  loadSeq: 0,

  onShow() {
    if (!isLoggedIn()) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      setTimeout(() => {
        // Keep return target so login can land back on favorites.
        wx.redirectTo({ url: '/pages/login/login?return=favorites' })
      }, 300)
      return
    }
    void this.load()
  },

  async load() {
    const seq = ++this.loadSeq
    this.setData({ loading: true })
    try {
      const list = await fetchFavorites()
      if (seq !== this.loadSeq) {
        return
      }
      const types = ENCYCLOPEDIA_TYPES
      const items: FavoriteRow[] = list.map((item) => ({
        ...item,
        typeName: typeNameForKey(item.typeKey, types),
        typeColor: colorForType(item.typeKey, types),
      }))
      this.setData({ items, loading: false })
    } catch (error) {
      if (seq !== this.loadSeq) {
        return
      }
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
    if (!id || this.data.unfavId) {
      return
    }
    this.setData({ unfavId: id })
    try {
      await removeFavorite(id)
      wx.showToast({ title: '已取消收藏', icon: 'none' })
      const items = (this.data.items as FavoriteRow[]).filter(
        (row) => row.encyclopediaId !== id,
      )
      this.setData({ items })
    } catch (error) {
      wx.showToast({
        title: error instanceof HttpError ? error.message : '操作失败',
        icon: 'none',
      })
    } finally {
      this.setData({ unfavId: '' })
    }
  },

  onGoMap() {
    wx.switchTab({ url: '/pages/map/map' })
  },
})
