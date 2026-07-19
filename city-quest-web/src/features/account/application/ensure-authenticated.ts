import type { SessionPort } from '../../../core/session/types'
import { messageFromUnknown } from '../../../core/error/messages'
import { confirmDialog, showToast } from '../../../shared/lib/toast'

export interface EnsureAuthenticatedDeps {
  session: SessionPort
  login: () => Promise<unknown>
  confirmLogin?: () => Promise<boolean>
  toast?: (title: string) => void
}

async function defaultConfirm(): Promise<boolean> {
  return confirmDialog({
    title: '登录',
    content: '登录后可同步收藏到你的账号。是否继续？',
    confirmText: '登录',
    cancelText: '取消',
  })
}

/**
 * @returns true only if already logged in (caller may proceed).
 *          false if cancelled, login failed, or just completed login
 *          (stay on page; do not auto-replay write actions).
 */
export function createEnsureAuthenticated(deps: EnsureAuthenticatedDeps) {
  const confirmLogin = deps.confirmLogin ?? defaultConfirm
  const toast = deps.toast ?? showToast

  return async function ensureAuthenticated(): Promise<boolean> {
    if (deps.session.isLoggedIn()) return true

    const ok = await confirmLogin()
    if (!ok) return false

    try {
      await deps.login()
      toast('登录成功')
    } catch (e) {
      toast(messageFromUnknown(e) || '登录失败，请重试')
    }
    return false
  }
}
