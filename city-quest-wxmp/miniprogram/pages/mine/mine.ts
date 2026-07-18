/**
 * Mine tab — session, history/favorites entries, compliance links.
 * Callers: WeChat tabBar.
 */

import { getAppContext } from '../../app-context'
import { fileUrl } from '../../core/config/env'
import { navigateTo } from '../../core/navigation/nav'
import { AccountRoutes } from '../../features/account/public'
import { EncyclopediaRoutes } from '../../features/encyclopedia/public'

function resolveAvatarDisplay(
  avatarKeyOrUrl: string | null | undefined,
): string {
  if (!avatarKeyOrUrl) return ''
  if (
    avatarKeyOrUrl.startsWith('http://') ||
    avatarKeyOrUrl.startsWith('https://') ||
    avatarKeyOrUrl.startsWith('wxfile://')
  ) {
    return avatarKeyOrUrl
  }
  return fileUrl(avatarKeyOrUrl)
}

Page({
  data: {
    loggedIn: false,
    nickname: '',
    avatarUrl: '',
  },

  onShow() {
    this.refreshSession()
  },

  refreshSession() {
    const { session } = getAppContext()
    const user = session.getUser()
    this.setData({
      loggedIn: session.isLoggedIn(),
      nickname: user?.nickname || '探秘用户',
      avatarUrl: resolveAvatarDisplay(user?.avatarUrl),
    })
  },

  async goLogin() {
    await getAppContext().ensureAuthenticated()
    this.refreshSession()
  },

  goProfile() {
    if (!getAppContext().session.isLoggedIn()) return
    navigateTo(AccountRoutes.profile)
  },

  goHistory() {
    navigateTo(EncyclopediaRoutes.history)
  },

  goFavorites() {
    if (!getAppContext().session.isLoggedIn()) return
    navigateTo(EncyclopediaRoutes.favorites)
  },

  goAbout() {
    navigateTo(AccountRoutes.about)
  },

  goAgreement() {
    navigateTo(AccountRoutes.agreement)
  },

  goPrivacy() {
    navigateTo(AccountRoutes.privacy)
  },

  onLogout() {
    wx.showModal({
      title: '退出登录',
      content: '确定退出登录？',
      confirmText: '退出',
      cancelText: '取消',
      success: (res) => {
        if (!res.confirm) return
        getAppContext().logout()
        this.refreshSession()
      },
    })
  },
})
