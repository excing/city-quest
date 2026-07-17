/**
 * Ensure logged in — authorize dialog → loading → login API, stay on page.
 * Does NOT auto-replay the original write action after login.
 * Callers: presentation (favorite button, mine login, etc.).
 */

import type { SessionPort } from '../../../core/session/types'
import { messageFromUnknown } from '../../../core/error/messages'

export interface EnsureAuthenticatedDeps {
  session: SessionPort
  /** Performs wx.login + server login + session write */
  login: () => Promise<unknown>
  /** Optional confirm UI; default uses wx.showModal */
  confirmLogin?: () => Promise<boolean>
  /** Injectable toasts for tests */
  toast?: (title: string) => void
  /** Native-style loading overlay (wx.showLoading) */
  showLoading?: (title: string) => void
  hideLoading?: () => void
}

async function defaultConfirm(): Promise<boolean> {
  return new Promise((resolve) => {
    wx.showModal({
      title: '授权登录',
      content:
        '使用微信账号快速登录。登录后可同步收藏到你的账号。',
      confirmText: '允许',
      cancelText: '取消',
      success(res) {
        resolve(Boolean(res.confirm))
      },
      fail() {
        resolve(false)
      },
    })
  })
}

function defaultToast(title: string): void {
  wx.showToast({ title, icon: 'none' })
}

function defaultShowLoading(title: string): void {
  wx.showLoading({ title, mask: true })
}

function defaultHideLoading(): void {
  wx.hideLoading()
}

/**
 * @returns true only if already logged in (caller may proceed).
 *          false if cancelled, login failed, or just completed login
 *          (stay on page; do not auto-replay write actions).
 */
export function createEnsureAuthenticated(deps: EnsureAuthenticatedDeps) {
  const confirmLogin = deps.confirmLogin ?? defaultConfirm
  const toast = deps.toast ?? defaultToast
  const showLoading = deps.showLoading ?? defaultShowLoading
  const hideLoading = deps.hideLoading ?? defaultHideLoading

  return async function ensureAuthenticated(): Promise<boolean> {
    if (deps.session.isLoggedIn()) return true

    const ok = await confirmLogin()
    if (!ok) return false

    showLoading('登录中')
    try {
      await deps.login()
      hideLoading()
      toast('登录成功')
    } catch (e) {
      hideLoading()
      toast(messageFromUnknown(e) || '登录失败，请重试')
    }
    // Never auto-execute the original write action after a fresh login.
    return false
  }
}
