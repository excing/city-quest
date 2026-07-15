/**
 * Ensure logged in — PRD: prompt → login page → do NOT auto-replay action.
 * Callers: presentation (favorite button etc.).
 */

import type { SessionPort } from '../../../core/session/types'
import {
  buildReturnUrl,
  navigateTo,
  withReturnUrl,
} from '../../../core/navigation/nav'
import { AccountRoutes } from '../routes'

export interface EnsureAuthenticatedDeps {
  session: SessionPort
  /** Optional confirm UI; default uses wx.showModal */
  confirmLogin?: () => Promise<boolean>
}

async function defaultConfirm(): Promise<boolean> {
  return new Promise((resolve) => {
    wx.showModal({
      title: '需要登录',
      content:
        '登录后收藏会保存到你的账号，换手机也能查看。登录成功后将返回本页，需再次点击收藏。',
      confirmText: '去登录',
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

/**
 * @returns true if already logged in; false if redirected or cancelled.
 * Never auto-executes the original write action after login.
 */
export function createEnsureAuthenticated(deps: EnsureAuthenticatedDeps) {
  const confirmLogin = deps.confirmLogin ?? defaultConfirm

  return async function ensureAuthenticated(options?: {
    /** Absolute path of current page for returnUrl */
    currentPath?: string
    query?: Record<string, string>
  }): Promise<boolean> {
    if (deps.session.isLoggedIn()) return true

    const ok = await confirmLogin()
    if (!ok) return false

    const returnUrl = buildReturnUrl(
      options?.currentPath ?? AccountRoutes.mine,
      options?.query,
    )
    navigateTo(withReturnUrl(AccountRoutes.login, returnUrl))
    return false
  }
}
