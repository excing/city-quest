/**
 * Navigation helpers (returnUrl-friendly).
 * Callers: account ensureAuthenticated, pages.
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

/** Encode current page path + query as returnUrl param value. */
export function buildReturnUrl(path: string, query?: Record<string, string>): string {
  const q = query
    ? Object.keys(query)
        .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(query[k])}`)
        .join('&')
    : ''
  const full = q ? `${path}?${q}` : path
  return encodeURIComponent(full)
}

export function withReturnUrl(loginPath: string, returnUrl: string): string {
  const sep = loginPath.includes('?') ? '&' : '?'
  return `${loginPath}${sep}returnUrl=${returnUrl}`
}
