/**
 * Login shell — full form in Phase B.
 */
import { getAppContext } from '../../../app-context'
import { messageFromUnknown } from '../../../core/error/messages'
import { navigateBack } from '../../../core/navigation/nav'

Page({
  data: {
    error: '',
    loading: false,
  },
  async onLogin() {
    this.setData({ loading: true, error: '' })
    try {
      await getAppContext().login({})
      navigateBack()
    } catch (e) {
      this.setData({ error: messageFromUnknown(e), loading: false })
    }
  },
})
