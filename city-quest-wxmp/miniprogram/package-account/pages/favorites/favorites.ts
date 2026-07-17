/**
 * Server-side favorites list (Phase 3). Login required.
 * Callers: WeChat router; entry from pages/mine when logged in.
 * API: listFavorites / removeFavorite via getAppContext().
 * Schema: FavoriteListItem { encyclopediaId, name, typeKey, coverUrl?, intro?, status, favoritedAt }.
 * User instruction: 按该文档, 选择合适的agents/skills, 实现阶段3.
 */

import { getAppContext } from '../../../app-context'
import { messageFromUnknown } from '../../../core/error/messages'
import { navigateTo, switchTab } from '../../../core/navigation/nav'
import { AccountRoutes } from '../../../features/account/public'
import type { FavoriteListItem } from '../../../features/encyclopedia/public'
import {
  buildTypeMap,
  detailUrl,
  EncyclopediaRoutes,
  typeColorOf,
  typeNameOf,
} from '../../../features/encyclopedia/public'

interface FavoriteRow {
  encyclopediaId: string
  name: string
  typeName: string
  typeColor: string
  intro: string
  coverUrl: string
  hasCover: boolean
  isUnpublished: boolean
  removing: boolean
}

function toRows(items: FavoriteListItem[]): FavoriteRow[] {
  const typeMap = buildTypeMap([])
  return items.map((item) => {
    const coverUrl = item.coverUrl || ''
    const status = (item.status || '').toLowerCase()
    const isUnpublished =
      status === 'unpublished' || status === 'offline' || status === 'draft'
    return {
      encyclopediaId: item.encyclopediaId,
      name: item.name,
      typeName: typeNameOf(item.typeKey, typeMap),
      typeColor: typeColorOf(item.typeKey, typeMap),
      intro: item.intro || '',
      coverUrl,
      hasCover: Boolean(coverUrl),
      isUnpublished,
      removing: false,
    }
  })
}

Page({
  data: {
    items: [] as FavoriteRow[],
    empty: true,
    loading: true,
    error: '',
  },

  onShow() {
    void this.bootstrap()
  },

  async bootstrap() {
    const ctx = getAppContext()
    if (!ctx.session.isLoggedIn()) {
      await ctx.ensureAuthenticated()
      if (!ctx.session.isLoggedIn()) {
        switchTab(AccountRoutes.mine)
        return
      }
    }
    await this.reload()
  },

  async reload() {
    this.setData({ loading: true, error: '' })
    try {
      const list = await getAppContext().listFavorites()
      const rows = toRows(list)
      this.setData({ items: rows, empty: rows.length === 0, loading: false })
    } catch (e) {
      this.setData({
        loading: false,
        error: messageFromUnknown(e),
        items: [],
        empty: true,
      })
    }
  },

  onOpen(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as string
    const raw = e.currentTarget.dataset.unpublished
    const unpublished = raw === true || raw === 'true'
    if (!id) return
    if (unpublished) {
      wx.showToast({ title: '该地点已下架，暂时无法查看', icon: 'none' })
      return
    }
    navigateTo(detailUrl(id))
  },

  async onRemove(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as string
    if (!id) return
    const items = this.data.items.map((row) =>
      row.encyclopediaId === id ? { ...row, removing: true } : row,
    )
    this.setData({ items })
    try {
      await getAppContext().removeFavorite(id)
      const next = this.data.items.filter((row) => row.encyclopediaId !== id)
      this.setData({ items: next, empty: next.length === 0 })
      wx.showToast({ title: '已取消收藏', icon: 'none' })
    } catch (err) {
      const restored = this.data.items.map((row) =>
        row.encyclopediaId === id ? { ...row, removing: false } : row,
      )
      this.setData({ items: restored })
      wx.showToast({ title: messageFromUnknown(err), icon: 'none' })
    }
  },

  goMap() {
    switchTab(EncyclopediaRoutes.map)
  },

  onRetry() {
    void this.reload()
  },
})
