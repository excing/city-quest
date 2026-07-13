/**
 * Callers: detail favorite and any need-login action.
 * PRD: modal → login → back; do NOT auto-continue action.
 * User: 开始阶段B 和 C, 完成产品闭环.
 */
import { isLoggedIn } from '../stores/session'

/**
 * Ensures user is logged in. Returns true if already logged in.
 * If not, shows modal and navigates to login on confirm.
 */
export function ensureLoggedIn(): boolean {
  if (isLoggedIn()) {
    return true
  }
  wx.showModal({
    title: '需要登录',
    content:
      '登录后收藏会保存到你的账号，换手机也能查看。登录成功后将返回本页，需再次点击收藏。',
    confirmText: '去登录',
    cancelText: '取消',
    success: (res) => {
      if (res.confirm) {
        wx.navigateTo({ url: '/pages/login/login' })
      }
    },
  })
  return false
}
