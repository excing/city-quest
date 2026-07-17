import { describe, expect, it, vi } from 'vitest'
import { createLogin } from '../miniprogram/features/account/application/login'
import type { SessionPort, SessionUser } from '../miniprogram/core/session/types'
import type { AuthRepository } from '../miniprogram/features/account/domain/ports'

function createSessionStub(): SessionPort {
  let token: string | null = null
  let user: SessionUser | null = null
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

describe('createLogin', () => {
  it('exchanges code only (no avatar/nickname) and stores session', async () => {
    const session = createSessionStub()
    const loginWithWechat = vi.fn(async (input: { code: string }) => {
      expect(input).toEqual({ code: 'wx-code-1' })
      return {
        token: 'jwt-1',
        user: { id: 'user-1', nickname: null, avatarUrl: null },
      }
    })
    const authRepo: AuthRepository = { loginWithWechat }
    const login = createLogin({
      authRepo,
      session,
      getWxLoginCode: async () => 'wx-code-1',
    })

    const user = await login()

    expect(user.id).toBe('user-1')
    expect(session.getToken()).toBe('jwt-1')
    expect(session.getUser()?.id).toBe('user-1')
    expect(loginWithWechat).toHaveBeenCalledWith({ code: 'wx-code-1' })
  })
})
