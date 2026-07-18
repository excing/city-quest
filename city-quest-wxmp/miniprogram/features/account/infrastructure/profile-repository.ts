/**
 * Profile API + avatar upload.
 * Callers: composition → account application.
 */

import { apiUrl } from '../../../core/config/env'
import type { HttpClient } from '../../../core/http/client'
import { HttpError } from '../../../core/http/errors'
import type { ApiResponse } from '../../../core/http/types'
import type { SessionPort, SessionUser } from '../../../core/session/types'
import type { ProfileRepository, ProfileUpdateInput } from '../domain/ports'

interface ProfileResponse {
  id: string
  nickname?: string | null
  avatarUrl?: string | null
  phone?: string | null
}

interface UploadAvatarResponse {
  key: string
}

function mapUser(user: ProfileResponse): SessionUser {
  return {
    id: user.id,
    nickname: user.nickname,
    avatarUrl: user.avatarUrl,
    phone: user.phone,
  }
}

export function createProfileRepository(
  http: HttpClient,
  session: SessionPort,
): ProfileRepository {
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

    async uploadAvatar(localPath: string): Promise<{ key: string }> {
      const token = session.getToken()
      if (!token) {
        throw new HttpError(401, 'UNAUTHORIZED', '请先登录')
      }

      return new Promise<{ key: string }>((resolve, reject) => {
        wx.uploadFile({
          url: apiUrl('/api/v1/me/avatar'),
          filePath: localPath,
          name: 'file',
          header: {
            Authorization: `Bearer ${token}`,
          },
          success(res) {
            if (res.statusCode === 401) {
              session.clear()
              reject(new HttpError(401, 'UNAUTHORIZED', '请先登录'))
              return
            }
            let body: ApiResponse<UploadAvatarResponse>
            try {
              body =
                typeof res.data === 'string'
                  ? (JSON.parse(res.data) as ApiResponse<UploadAvatarResponse>)
                  : (res.data as ApiResponse<UploadAvatarResponse>)
            } catch {
              reject(
                new HttpError(res.statusCode, 'INTERNAL_ERROR', '响应格式无效'),
              )
              return
            }
            if (!body || typeof body !== 'object' || !('success' in body)) {
              reject(
                new HttpError(res.statusCode, 'INTERNAL_ERROR', '响应格式无效'),
              )
              return
            }
            if (!body.success) {
              const errCode =
                (body.error && body.error.code) || 'INTERNAL_ERROR'
              const errMessage =
                (body.error && body.error.message) || '上传失败'
              reject(new HttpError(res.statusCode, errCode, errMessage))
              return
            }
            if (!body.data || !body.data.key) {
              reject(
                new HttpError(res.statusCode, 'INTERNAL_ERROR', '上传失败'),
              )
              return
            }
            resolve({ key: body.data.key })
          },
          fail(err) {
            reject(
              new HttpError(0, 'NETWORK_ERROR', err.errMsg || '网络错误'),
            )
          },
        })
      })
    },
  }
}
