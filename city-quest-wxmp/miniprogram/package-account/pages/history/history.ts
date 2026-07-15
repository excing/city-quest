/**
 * Local browse history list (Phase 3).
 * Callers: WeChat router (package-account); entry from pages/mine.
 * API: getAppContext().listBrowseHistory / clearBrowseHistory.
 * Schema: BrowseHistoryItem { id, name, typeKey, coverUrl?, intro?, viewedAt ISO }.
 * User instruction: 按该文档, 选择合适的agents/skills, 实现阶段3.
 */

import { getAppContext } from '../../../app-context'
import { navigateTo, switchTab } from '../../../core/navigation/nav'
import type { BrowseHistoryItem } from '../../../features/encyclopedia/public'
import {
  buildTypeMap,
  detailUrl,
  EncyclopediaRoutes,
  typeColorOf,
  typeNameOf,
} from '../../../features/encyclopedia/public'

interface HistoryRow {
  id: string
  name: string
  typeName: string
  typeColor: string
  intro: string
  coverUrl: string
  hasCover: boolean
  viewedAtLabel: string
}

function formatViewedAt(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const mm = `${d.getMonth() + 1}`.padStart(2, '0')
  const dd = `${d.getDate()}`.padStart(2, '0')
  const hh = `${d.getHours()}`.padStart(2, '0')
  const mi = `${d.getMinutes()}`.padStart(2, '0')
  return `${mm}-${dd} ${hh}:${mi}`
}

function toRows(items: BrowseHistoryItem[]): HistoryRow[] {
  const typeMap = buildTypeMap([])
  return items.map((item) => {
    const coverUrl = item.coverUrl || ''
    return {
      id: item.id,
      name: item.name,
      typeName: typeNameOf(item.typeKey, typeMap),
      typeColor: typeColorOf(item.typeKey, typeMap),
      intro: item.intro || '',
      coverUrl,
      hasCover: Boolean(coverUrl),
      viewedAtLabel: formatViewedAt(item.viewedAt),
    }
  })
}

Page({
  data: {
    items: [] as HistoryRow[],
    empty: true,
  },

  onShow() {
    this.reload()
  },

  reload() {
    const items = getAppContext().listBrowseHistory()
    const rows = toRows(items)
    this.setData({ items: rows, empty: rows.length === 0 })
  },

  onOpen(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as string
    if (!id) return
    navigateTo(detailUrl(id))
  },

  onClear() {
    if (this.data.empty) return
    wx.showModal({
      title: '清空浏览记录',
      content: '确定清空全部浏览记录？此操作不可恢复。',
      confirmText: '清空',
      cancelText: '取消',
      success: (res) => {
        if (!res.confirm) return
        getAppContext().clearBrowseHistory()
        this.reload()
        wx.showToast({ title: '已清空', icon: 'none' })
      },
    })
  },

  goMap() {
    switchTab(EncyclopediaRoutes.map)
  },
})
