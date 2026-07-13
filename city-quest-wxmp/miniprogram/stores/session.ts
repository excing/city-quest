/**
 * Callers: login page, mine, login-guard, detail favorite.
 * Schema: local token + user profile cache (wx storage).
 * User: 开始阶段B 和 C, 完成产品闭环.
 */
import { clearToken, getToken, setToken } from '../storage/token'

const USER_KEY = 'city_quest_user'

export interface SessionUser {
  id: string
  nickname: string | null
  avatarUrl: string | null
}

export function isLoggedIn(): boolean {
  return Boolean(getToken())
}

export function getSessionUser(): SessionUser | null {
  try {
    const raw = wx.getStorageSync(USER_KEY) as SessionUser | undefined
    if (!raw || typeof raw !== 'object' || !raw.id) {
      return null
    }
    return raw
  } catch {
    return null
  }
}

export function setSession(token: string, user: SessionUser): void {
  setToken(token)
  wx.setStorageSync(USER_KEY, user)
}

export function clearSession(): void {
  clearToken()
  try {
    wx.removeStorageSync(USER_KEY)
  } catch {
    // ignore
  }
}
