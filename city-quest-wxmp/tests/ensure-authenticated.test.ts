import { describe, expect, it, vi } from 'vitest'
import { createEnsureAuthenticated } from '../miniprogram/features/account/application/ensure-authenticated'
import type { SessionPort, SessionUser } from '../miniprogram/core/session/types'

function createSessionStub(loggedIn: boolean): SessionPort {
  let token: string | null = loggedIn ? 'tok' : null
  let user: SessionUser | null = loggedIn ? { id: 'u1' } : null
  return {
    hydrate() {},
    getToken: () => token,
    getUser: () => user,
    isLoggedIn: () => Boolean(token),
    setSession(nextToken, nextUser) {
      token = nextToken
      user = nextUser
    },
    clear() {
      token = null
      user = null
    },
    subscribe() {
      return () => {}
    },
    getSnapshot: () => ({ token, user }),
  }
}

describe('createEnsureAuthenticated', () => {
  it('returns true when already logged in without prompting', async () => {
    const confirmLogin = vi.fn(async () => true)
    const login = vi.fn(async () => ({ id: 'u1' }))
    const toast = vi.fn()
    const showLoading = vi.fn()
    const hideLoading = vi.fn()
    const ensure = createEnsureAuthenticated({
      session: createSessionStub(true),
      login,
      confirmLogin,
      toast,
      showLoading,
      hideLoading,
    })

    await expect(ensure()).resolves.toBe(true)
    expect(confirmLogin).not.toHaveBeenCalled()
    expect(login).not.toHaveBeenCalled()
    expect(toast).not.toHaveBeenCalled()
    expect(showLoading).not.toHaveBeenCalled()
    expect(hideLoading).not.toHaveBeenCalled()
  })

  it('returns false when user cancels authorize dialog', async () => {
    const confirmLogin = vi.fn(async () => false)
    const login = vi.fn(async () => ({ id: 'u1' }))
    const toast = vi.fn()
    const showLoading = vi.fn()
    const hideLoading = vi.fn()
    const ensure = createEnsureAuthenticated({
      session: createSessionStub(false),
      login,
      confirmLogin,
      toast,
      showLoading,
      hideLoading,
    })

    await expect(ensure()).resolves.toBe(false)
    expect(confirmLogin).toHaveBeenCalledTimes(1)
    expect(login).not.toHaveBeenCalled()
    expect(toast).not.toHaveBeenCalled()
    expect(showLoading).not.toHaveBeenCalled()
    expect(hideLoading).not.toHaveBeenCalled()
  })

  it('shows loading during login and still returns false (no auto-replay)', async () => {
    const session = createSessionStub(false)
    const confirmLogin = vi.fn(async () => true)
    const order: string[] = []
    const showLoading = vi.fn((title: string) => {
      order.push(`show:${title}`)
    })
    const hideLoading = vi.fn(() => {
      order.push('hide')
    })
    const login = vi.fn(async () => {
      order.push('login')
      session.setSession('new-tok', { id: 'u2', nickname: null })
      return { id: 'u2', nickname: null }
    })
    const toast = vi.fn((title: string) => {
      order.push(`toast:${title}`)
    })
    const ensure = createEnsureAuthenticated({
      session,
      login,
      confirmLogin,
      toast,
      showLoading,
      hideLoading,
    })

    await expect(ensure()).resolves.toBe(false)
    expect(login).toHaveBeenCalledTimes(1)
    expect(showLoading).toHaveBeenCalledWith('登录中')
    expect(hideLoading).toHaveBeenCalledTimes(1)
    expect(toast).toHaveBeenCalledWith('登录成功')
    expect(order).toEqual(['show:登录中', 'login', 'hide', 'toast:登录成功'])
    expect(session.isLoggedIn()).toBe(true)
  })

  it('hides loading and toasts failure when login throws', async () => {
    const confirmLogin = vi.fn(async () => true)
    const showLoading = vi.fn()
    const hideLoading = vi.fn()
    const login = vi.fn(async () => {
      throw new Error('网络异常，请检查网络后重试')
    })
    const toast = vi.fn()
    const ensure = createEnsureAuthenticated({
      session: createSessionStub(false),
      login,
      confirmLogin,
      toast,
      showLoading,
      hideLoading,
    })

    await expect(ensure()).resolves.toBe(false)
    expect(showLoading).toHaveBeenCalledWith('登录中')
    expect(hideLoading).toHaveBeenCalledTimes(1)
    expect(login).toHaveBeenCalledTimes(1)
    expect(toast).toHaveBeenCalledWith('网络异常，请检查网络后重试')
  })
})
