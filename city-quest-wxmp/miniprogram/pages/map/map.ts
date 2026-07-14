/**
 * Thin map page shell — full map UX in Phase 3.
 * Callers: WeChat router (tab).
 */

import { getAppContext } from '../../app-context'
import { messageFromUnknown } from '../../core/error/messages'
import { createLoadSeq } from '../../shared/lib/load-seq'

const loadSeq = createLoadSeq()

Page({
  data: {
    statusText: '架构骨架：地图页',
    markerCount: 0,
    error: '',
  },

  onShow() {
    void this.reload()
  },

  async reload() {
    const seq = loadSeq.next()
    this.setData({ error: '', statusText: '加载点位…' })
    try {
      const { loadMapPoints } = getAppContext()
      const result = await loadMapPoints()
      if (!loadSeq.isCurrent(seq)) return
      this.setData({
        markerCount: result.markers.length,
        statusText: `已加载 ${result.markers.length} 个点位（骨架）`,
      })
    } catch (e) {
      if (!loadSeq.isCurrent(seq)) return
      this.setData({
        error: messageFromUnknown(e),
        statusText: '加载失败',
      })
    }
  },

  onRetry() {
    void this.reload()
  },
})
