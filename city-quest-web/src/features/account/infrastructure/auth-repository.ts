import type { HttpClient } from '../../../core/http/client'
import type { SessionUser } from '../../../core/session/types'
import type { AuthRepository } from '../domain/ports'

interface LoginResponse {
  token: string
  user: {
    id: string
    nickname?: string | null
    avatarUrl?: string | null
    phone?: string | null
  }
}

function mapUser(user: LoginResponse['user']): SessionUser {
  return {
    id: user.id,
    nickname: user.nickname,
    avatarUrl: user.avatarUrl,
    phone: user.phone,
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
          nickname: input.nickname,
          avatarUrl: input.avatarUrl,
        },
      })
      return {
        token: data.token,
        user: mapUser(data.user),
      }
    },
  }
}
