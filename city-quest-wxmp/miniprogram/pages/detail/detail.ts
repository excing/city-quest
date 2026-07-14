/**
 * Detail shell — loads via openDetail use case.
 */
import { getAppContext } from '../../app-context'
import { messageFromUnknown } from '../../core/error/messages'

Page({
  data: {
    id: '',
    name: '',
    intro: '',
    error: '',
    loading: true,
  },
  onLoad(query: Record<string, string | undefined>) {
    const id = query.id || ''
    this.setData({ id })
    if (!id) {
      this.setData({ loading: false, error: '缺少百科 id' })
      return
    }
    void this.load(id)
  },
  async load(id: string) {
    this.setData({ loading: true, error: '' })
    try {
      const detail = await getAppContext().openDetail(id)
      this.setData({
        loading: false,
        name: detail.name,
        intro: detail.intro,
      })
    } catch (e) {
      this.setData({ loading: false, error: messageFromUnknown(e) })
    }
  },
})
