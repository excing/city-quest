/**
 * WeChat login API repository.
 * Callers: composition → account application.
 */

import type { HttpClient } from '../../../core/http/client'
import type { SessionUser } from '../../../core/session/types'
import type { AuthRepository } from '../domain/ports'

interface LoginResponse {
  token: string
  user: {
    id: string
    nickname?: string | null
    avatarUrl?: string | null
  }
}

export function createAuthRepository(http: HttpClient): AuthRepository {
  return {
    async loginWithWechat(input): Promise<{ token: string; user: SessionUser }> {
      const data = await http.request<LoginResponse>({
        path: '/api/v1/auth/wechat/login',
        method: 'POST',
        data: {
          code: input.code,
        },
      })
      return {
        token: data.token,
        user: {
          id: data.user.id,
          nickname: data.user.nickname,
          avatarUrl: data.user.avatarUrl,
        },
      }
    },
  }
}
