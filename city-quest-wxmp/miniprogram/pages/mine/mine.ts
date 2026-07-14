/**
 * Mine tab shell.
 * Callers: WeChat tabBar.
 */
import { getAppContext } from '../../app-context'
import { AccountRoutes } from '../../features/account/public'
import { EncyclopediaRoutes } from '../../features/encyclopedia/public'
import { navigateTo } from '../../core/navigation/nav'

Page({
  data: {
    loggedIn: false,
    nickname: '',
  },
  onShow() {
    const { session } = getAppContext()
    const user = session.getUser()
    this.setData({
      loggedIn: session.isLoggedIn(),
      nickname: user?.nickname || '',
    })
  },
  goLogin() {
    navigateTo(AccountRoutes.login)
  },
  goHistory() {
    navigateTo(EncyclopediaRoutes.history)
  },
  goFavorites() {
    navigateTo(EncyclopediaRoutes.favorites)
  },
  goAbout() {
    navigateTo(AccountRoutes.about)
  },
  onLogout() {
    getAppContext().logout()
    this.onShow()
  },
})
