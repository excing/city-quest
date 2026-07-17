/**
 * Navigation helpers.
 * Callers: pages (mine, detail, favorites, history, etc.).
 */

export function navigateTo(url: string): void {
  wx.navigateTo({ url })
}

export function navigateBack(delta = 1): void {
  wx.navigateBack({ delta })
}

export function switchTab(url: string): void {
  wx.switchTab({ url })
}
