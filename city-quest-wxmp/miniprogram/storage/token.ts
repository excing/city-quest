/**
 * Callers: services/http, stores/session, login/logout pages.
 * Schema: local storage key city_quest_token string JWT.
 * User: 阅读 @docs , 然后选择合适的agents或skills, 开始进行开发.
 */

const TOKEN_KEY = 'city_quest_token'

export function getToken(): string | null {
  try {
    const value = wx.getStorageSync(TOKEN_KEY) as string | undefined
    return value && value.length > 0 ? value : null
  } catch {
    return null
  }
}

export function setToken(token: string): void {
  wx.setStorageSync(TOKEN_KEY, token)
}

export function clearToken(): void {
  try {
    wx.removeStorageSync(TOKEN_KEY)
  } catch {
    // ignore
  }
}
