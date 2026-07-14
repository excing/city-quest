/**
 * Login use case: wx.login code → server → session.
 */

import type { SessionPort, SessionUser } from '../../../core/session/types'
import type { AuthRepository } from '../domain/ports'

export interface LoginInput {
  nickname?: string
  avatarUrl?: string
}

export function createLogin(deps: {
  authRepo: AuthRepository
  session: SessionPort
  /** Injectable for tests */
  getWxLoginCode?: () => Promise<string>
}) {
  const getCode =
    deps.getWxLoginCode ??
    (() =>
      new Promise<string>((resolve, reject) => {
        wx.login({
          success(res) {
            if (res.code) resolve(res.code)
            else reject(new Error('wx.login 未返回 code'))
          },
          fail(err) {
            reject(new Error(err.errMsg || 'wx.login 失败'))
          },
        })
      }))

  return async function login(input: LoginInput = {}): Promise<SessionUser> {
    const code = await getCode()
    const { token, user } = await deps.authRepo.loginWithWechat({
      code,
      nickname: input.nickname,
      avatarUrl: input.avatarUrl,
    })
    deps.session.setSession(token, user)
    return user
  }
}

export function createLogout(session: SessionPort) {
  return function logout(): void {
    session.clear()
  }
}
