/**
 * Login page — avatar/nickname optional, agreement required (Phase 3).
 * Callers: WeChat router (package-account).
 */

import { getAppContext } from '../../../app-context'
import { messageFromUnknown } from '../../../core/error/messages'
import {
  navigateBack,
  navigateTo,
  switchTab,
} from '../../../core/navigation/nav'
import { AccountRoutes } from '../../../features/account/public'

function decodeReturnUrl(raw?: string): string | null {
  if (!raw) return null
  try {
    return decodeURIComponent(raw)
  } catch {
    return null
  }
}

Page({
  data: {
    nickname: '',
    avatarUrl: '',
    agreed: false,
    loading: false,
    error: '',
  },

  _returnUrl: null as string | null,

  onLoad(query: Record<string, string | undefined>) {
    this._returnUrl = decodeReturnUrl(query.returnUrl)
  },

  onChooseAvatar(e: WechatMiniprogram.CustomEvent<{ avatarUrl: string }>) {
    const avatarUrl = e.detail?.avatarUrl || ''
    if (avatarUrl) this.setData({ avatarUrl })
  },

  onNicknameInput(e: WechatMiniprogram.Input) {
    this.setData({ nickname: e.detail.value || '' })
  },

  onNicknameBlur(e: WechatMiniprogram.Input) {
    this.setData({ nickname: (e.detail.value || '').trim() })
  },

  onToggleAgree() {
    this.setData({ agreed: !this.data.agreed })
  },

  goAgreement() {
    navigateTo(AccountRoutes.agreement)
  },

  goPrivacy() {
    navigateTo(AccountRoutes.privacy)
  },

  async onLogin() {
    if (!this.data.agreed) {
      wx.showToast({ title: '请先同意用户协议和隐私政策', icon: 'none' })
      return
    }
    this.setData({ loading: true, error: '' })
    try {
      await getAppContext().login({
        nickname: this.data.nickname.trim() || undefined,
        avatarUrl: this.data.avatarUrl || undefined,
      })
      this.setData({ loading: false })
      const fromDetail =
        Boolean(this._returnUrl) && this._returnUrl!.includes('/pages/detail/')
      wx.showToast({
        title: fromDetail
          ? '登录成功。若需收藏，请再点一次「收藏」。'
          : '登录成功',
        icon: 'none',
        duration: fromDetail ? 2500 : 1500,
      })
      this.leaveAfterLogin()
    } catch (e) {
      this.setData({
        loading: false,
        error: '登录失败，请重试',
      })
      void messageFromUnknown(e)
    }
  },

  leaveAfterLogin() {
    const returnUrl = this._returnUrl
    if (returnUrl) {
      const pages = getCurrentPages()
      if (pages.length > 1) {
        navigateBack()
        return
      }
      if (returnUrl.startsWith('/pages/map/') || returnUrl.startsWith('/pages/mine/')) {
        switchTab(returnUrl.split('?')[0])
        return
      }
      navigateTo(returnUrl.startsWith('/') ? returnUrl : `/${returnUrl}`)
      return
    }
    const pages = getCurrentPages()
    if (pages.length > 1) {
      navigateBack()
      return
    }
    switchTab(AccountRoutes.mine)
  },
})
