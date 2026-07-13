/**
 * Callers: pages/map selected marker preview.
 * User: 阅读 @docs , 然后选择合适的agents或skills, 开始进行开发.
 */
Component({
  properties: {
    name: { type: String, value: '' },
    typeName: { type: String, value: '' },
    typeColor: { type: String, value: '#2B4C7E' },
    intro: { type: String, value: '' },
    encyclopediaId: { type: String, value: '' },
  },
  methods: {
    onTap() {
      const id = this.data.encyclopediaId as string
      if (!id) {
        return
      }
      this.triggerEvent('open', { id })
    },
  },
})
