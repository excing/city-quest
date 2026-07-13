/**
 * Callers: Tab 我的. Login/logout/favorites entry.
 * User: 开始阶段B 和 C, 完成产品闭环.
 */
import {
  clearSession,
  getSessionUser,
  isLoggedIn,
  type SessionUser,
} from '../../stores/session'

Page({
  data: {
    loggedIn: false,
    user: null as SessionUser | null,
    defaultAvatar:
      'data:image/svg+xml,' +
      encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect fill="#E8EEF2" width="120" height="120"/><circle cx="60" cy="46" r="22" fill="#C9D0D6"/><ellipse cx="60" cy="98" rx="36" ry="28" fill="#C9D0D6"/></svg>',
      ),
  },

  onShow() {
    this.refreshSession()
  },

  refreshSession() {
    const loggedIn = isLoggedIn()
    this.setData({
      loggedIn,
      user: loggedIn ? getSessionUser() : null,
    })
  },

  onLogin() {
    wx.navigateTo({ url: '/pages/login/login' })
  },

  onLogout() {
    wx.showModal({
      title: '退出登录',
      content: '确定退出登录？',
      success: (res) => {
        if (!res.confirm) {
          return
        }
        clearSession()
        this.refreshSession()
        wx.showToast({ title: '已退出', icon: 'none' })
      },
    })
  },

  onOpenHistory() {
    wx.navigateTo({ url: '/pages/history/history' })
  },

  onOpenFavorites() {
    wx.navigateTo({ url: '/pages/favorites/favorites' })
  },

  onOpenAbout() {
    wx.navigateTo({ url: '/pages/about/about' })
  },

  onOpenAgreement() {
    wx.navigateTo({ url: '/pages/agreement/agreement' })
  },

  onOpenPrivacy() {
    wx.navigateTo({ url: '/pages/privacy/privacy' })
  },
})
