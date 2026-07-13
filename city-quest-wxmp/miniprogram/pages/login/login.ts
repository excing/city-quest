/**
 * Callers: mine / login-guard navigateTo.
 * API: wx.login + POST /auth/wechat/login. No auto-continue after success.
 * User: 开始阶段B 和 C, 完成产品闭环.
 */
import { loginWithWechat } from '../../services/auth'
import { HttpError } from '../../services/http'
import { setSession } from '../../stores/session'

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
      const result = await loginWithWechat({
        code,
        nickname: this.data.nickname || undefined,
        avatarUrl: this.data.avatarUrl || undefined,
      })
      setSession(result.token, {
        id: result.user.id,
        nickname: result.user.nickname,
        avatarUrl: result.user.avatarUrl,
      })
      wx.showToast({
        title: '登录成功。若需收藏，请再点一次「收藏」。',
        icon: 'none',
        duration: 2500,
      })
      setTimeout(() => {
        const pages = getCurrentPages()
        if (pages.length > 1) {
          wx.navigateBack()
        } else {
          wx.switchTab({ url: '/pages/mine/mine' })
        }
      }, 400)
    } catch (error) {
      wx.showToast({
        title: error instanceof HttpError ? error.message : '登录失败，请重试',
        icon: 'none',
      })
    } finally {
      this.setData({ submitting: false })
    }
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
