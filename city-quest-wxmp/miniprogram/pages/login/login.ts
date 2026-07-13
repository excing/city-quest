/**
 * Callers: mine / login-guard / favorites navigateTo.
 * API: wx.login + POST /auth/wechat/login. No auto-continue after success.
 * Query: optional return=favorites|history to land after login when stack is gone.
 */
import { loginWithWechat } from '../../services/auth'
import { HttpError } from '../../services/http'
import { setSession } from '../../stores/session'

type ReturnTarget = 'favorites' | 'history' | ''

Page({
  data: {
    nickname: '',
    avatarUrl: '',
    agreed: false,
    submitting: false,
    defaultAvatar:
      'data:image/svg+xml,' +
      encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect fill="#E8EEF2" width="120" height="120"/><circle cx="60" cy="46" r="22" fill="#C9D0D6"/><ellipse cx="60" cy="98" rx="36" ry="28" fill="#C9D0D6"/></svg>',
      ),
  },

  returnTarget: '' as ReturnTarget,

  onLoad(query: Record<string, string | undefined>) {
    const ret = query.return
    if (ret === 'favorites' || ret === 'history') {
      this.returnTarget = ret
    }
  },

  onChooseAvatar(e: WechatMiniprogram.CustomEvent<{ avatarUrl: string }>) {
    const avatarUrl = e.detail.avatarUrl
    if (avatarUrl) {
      this.setData({ avatarUrl })
    }
  },

  onNicknameInput(e: WechatMiniprogram.Input) {
    this.setData({ nickname: e.detail.value })
  },

  onNicknameBlur(e: WechatMiniprogram.Input) {
    this.setData({ nickname: e.detail.value })
  },

  onToggleAgree() {
    this.setData({ agreed: !this.data.agreed })
  },

  onOpenAgreement() {
    wx.navigateTo({ url: '/pages/agreement/agreement' })
  },

  onOpenPrivacy() {
    wx.navigateTo({ url: '/pages/privacy/privacy' })
  },

  async onSubmit() {
    if (!this.data.agreed) {
      wx.showToast({
        title: '请先同意用户协议和隐私政策',
        icon: 'none',
      })
      return
    }
    if (this.data.submitting) {
      return
    }
    this.setData({ submitting: true })
    try {
      const code = await getWxLoginCode()
      // Do not send chooseAvatar temp paths as durable avatar URLs.
      const result = await loginWithWechat({
        code,
        nickname: this.data.nickname.trim() || undefined,
      })
      setSession(result.token, {
        id: result.user.id,
        nickname: result.user.nickname || this.data.nickname.trim() || null,
        // Prefer server avatar; fall back to local preview only for this device session.
        avatarUrl: result.user.avatarUrl || this.data.avatarUrl || null,
      })
      wx.showToast({
        title: '登录成功。若需收藏，请再点一次「收藏」。',
        icon: 'none',
        duration: 2000,
      })
      setTimeout(() => {
        this.leaveAfterLogin()
      }, 900)
    } catch (error) {
      wx.showToast({
        title: error instanceof HttpError ? error.message : '登录失败，请重试',
        icon: 'none',
      })
    } finally {
      this.setData({ submitting: false })
    }
  },

  leaveAfterLogin() {
    const pages = getCurrentPages()
    if (pages.length > 1) {
      wx.navigateBack()
      return
    }
    if (this.returnTarget === 'favorites') {
      wx.redirectTo({ url: '/pages/favorites/favorites' })
      return
    }
    if (this.returnTarget === 'history') {
      wx.redirectTo({ url: '/pages/history/history' })
      return
    }
    wx.switchTab({ url: '/pages/mine/mine' })
  },
})

function getWxLoginCode(): Promise<string> {
  return new Promise((resolve, reject) => {
    wx.login({
      success: (res) => {
        if (res.code) {
          resolve(res.code)
          return
        }
        reject(new Error('no code'))
      },
      fail: () => reject(new Error('wx.login failed')),
    })
  })
}
