/**
 * Callers: pages/login.
 * API: POST /auth/wechat/login
 * User: 开始阶段B 和 C, 完成产品闭环.
 */
import { request } from './http'

export interface LoginResult {
  token: string
  user: {
    id: string
    nickname: string | null
    avatarUrl: string | null
  }
}

export function loginWithWechat(params: {
  code: string
  nickname?: string
  avatarUrl?: string
}): Promise<LoginResult> {
  return request<LoginResult>('/auth/wechat/login', {
    method: 'POST',
    auth: false,
    data: {
      code: params.code,
      nickname: params.nickname,
      avatarUrl: params.avatarUrl,
    },
  })
}
