/**
 * Profile edit page — avatar / nickname / phone.
 * Callers: WeChat router from mine user card (AccountRoutes.profile).
 * API: loadProfile / updateProfile via getAppContext().
 *
 * Note: avoid WechatMiniprogram.Input* type names — IDE plugin typings
 * may be older than project typings and fail to emit profile.js.
 */

import { getAppContext } from '../../../app-context'
import { fileUrl } from '../../../core/config/env'
import { messageFromUnknown } from '../../../core/error/messages'
import { switchTab } from '../../../core/navigation/nav'
import { AccountRoutes } from '../../../features/account/routes'

/** Temp local path from chooseAvatar; keep outside Page options. */
let pendingAvatarPath = ''

function resolveAvatarDisplay(avatarKeyOrUrl: string | null | undefined): string {
  if (!avatarKeyOrUrl) return ''
  if (avatarKeyOrUrl.indexOf('://') >= 0 || avatarKeyOrUrl.charAt(0) === '/') {
    return avatarKeyOrUrl
  }
  return fileUrl(avatarKeyOrUrl)
}

Page({
  data: {
    nickname: '',
    phone: '',
    displayAvatarUrl: '',
    saving: false,
  },

  onShow() {
    this.bootstrap()
  },

  async bootstrap() {
    const ctx = getAppContext()
    if (!ctx.session.isLoggedIn()) {
      await ctx.ensureAuthenticated()
      if (!ctx.session.isLoggedIn()) {
        switchTab(AccountRoutes.mine)
        return
      }
    }

    try {
      const user = await ctx.loadProfile()
      pendingAvatarPath = ''
      this.setData({
        nickname: user.nickname || '',
        phone: user.phone || '',
        displayAvatarUrl: resolveAvatarDisplay(user.avatarUrl),
      })
    } catch (e) {
      const user = ctx.session.getUser()
      this.setData({
        nickname: (user && user.nickname) || '',
        phone: (user && user.phone) || '',
        displayAvatarUrl: resolveAvatarDisplay(user && user.avatarUrl),
      })
      wx.showToast({
        title: messageFromUnknown(e) || '加载资料失败',
        icon: 'none',
      })
    }
  },

  onChooseAvatar(e: { detail?: { avatarUrl?: string } }) {
    const path = e.detail && e.detail.avatarUrl
    if (!path) return
    pendingAvatarPath = path
    this.setData({ displayAvatarUrl: path })
  },

  onNicknameInput(e: { detail: { value: string } }) {
    this.setData({ nickname: e.detail.value })
  },

  onNicknameBlur(e: { detail: { value: string } }) {
    this.setData({ nickname: e.detail.value })
  },

  onPhoneInput(e: { detail: { value: string } }) {
    this.setData({ phone: e.detail.value })
  },

  async onSave() {
    if (this.data.saving) return
    this.setData({ saving: true })
    try {
      await getAppContext().updateProfile({
        nickname: this.data.nickname,
        phone: this.data.phone,
        localAvatarPath: pendingAvatarPath || null,
      })
      pendingAvatarPath = ''
      wx.showToast({ title: '已保存', icon: 'success' })
      setTimeout(() => {
        wx.navigateBack({ delta: 1 })
      }, 400)
    } catch (e) {
      wx.showToast({
        title: messageFromUnknown(e) || '保存失败',
        icon: 'none',
      })
    } finally {
      this.setData({ saving: false })
    }
  },
})
