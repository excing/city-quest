/**
 * Callers: mine → history. Local browse list; clear with confirm.
 * User: 阅读 @docs , 然后选择合适的agents或skills, 开始进行开发.
 */
import { ENCYCLOPEDIA_TYPES } from '../../config/encyclopedia-types'
import {
  clearBrowseHistory,
  listBrowseHistory,
  type BrowseHistoryItem,
} from '../../storage/browse-history'
import { formatViewedAt } from '../../utils/format'
import { colorForType, typeNameForKey } from '../../utils/map'

interface HistoryRow extends BrowseHistoryItem {
  typeName: string
  typeColor: string
  viewedAtText: string
}

Page({
  data: {
    items: [] as HistoryRow[],
  },

  onShow() {
    this.refresh()
  },

  refresh() {
    const types = ENCYCLOPEDIA_TYPES
    const items: HistoryRow[] = listBrowseHistory().map((item) => ({
      ...item,
      typeName: typeNameForKey(item.typeKey, types),
      typeColor: colorForType(item.typeKey, types),
      viewedAtText: formatViewedAt(item.viewedAt),
    }))
    this.setData({ items })
  },

  onOpenDetail(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as string | undefined
    if (!id) {
      return
    }
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` })
  },

  onClear() {
    wx.showModal({
      title: '清空浏览记录',
      content: '确定清空全部浏览记录？此操作不可恢复。',
      confirmText: '清空',
      confirmColor: '#C23B3B',
      success: (res) => {
        if (!res.confirm) {
          return
        }
        clearBrowseHistory()
        this.refresh()
        wx.showToast({ title: '已清空', icon: 'none' })
      },
    })
  },

  onGoMap() {
    wx.switchTab({ url: '/pages/map/map' })
  },
})
