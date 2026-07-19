import type { HttpClient } from '../../../core/http/client'
import type { SessionUser } from '../../../core/session/types'
import type { ProfileRepository, ProfileUpdateInput } from '../domain/ports'

interface ProfileResponse {
  id: string
  nickname?: string | null
  avatarUrl?: string | null
  phone?: string | null
}

function mapUser(user: ProfileResponse): SessionUser {
  return {
    id: user.id,
    nickname: user.nickname,
    avatarUrl: user.avatarUrl,
    phone: user.phone,
  }
}

export function createProfileRepository(http: HttpClient): ProfileRepository {
  return {
    async getProfile(): Promise<SessionUser> {
      const data = await http.request<ProfileResponse>({
        path: '/api/v1/me',
        method: 'GET',
        auth: true,
      })
      return mapUser(data)
    },

    async updateProfile(input: ProfileUpdateInput): Promise<SessionUser> {
      const data = await http.request<ProfileResponse>({
        path: '/api/v1/me',
        method: 'POST',
        auth: true,
        data: input,
      })
      return mapUser(data)
    },

    async uploadAvatar(
      file: File | Blob,
      fileName?: string,
    ): Promise<{ key: string }> {
      return http.upload<{ key: string }>({
        path: '/api/v1/me/avatar',
        file,
        fileName,
        auth: true,
      })
    },
  }
}
