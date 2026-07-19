import type { SessionUser } from '../../../core/session/types'

export interface AuthRepository {
  loginWithWechat(input: {
    code: string
    nickname?: string | null
    avatarUrl?: string | null
  }): Promise<{ token: string; user: SessionUser }>
}

export interface ProfileUpdateInput {
  nickname?: string
  phone?: string | null
  avatarKey?: string
}

export interface ProfileRepository {
  getProfile(): Promise<SessionUser>
  updateProfile(input: ProfileUpdateInput): Promise<SessionUser>
  uploadAvatar(file: File | Blob, fileName?: string): Promise<{ key: string }>
}
