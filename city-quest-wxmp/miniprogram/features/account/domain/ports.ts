/**
 * Account ports.
 * Callers: account application.
 */

import type { SessionUser } from '../../../core/session/types'

export interface AuthRepository {
  loginWithWechat(input: {
    code: string
  }): Promise<{ token: string; user: SessionUser }>
}

export interface ProfileUpdateInput {
  nickname?: string
  phone?: string | null
  avatarKey?: string | null
}

export interface ProfileRepository {
  getProfile(): Promise<SessionUser>
  updateProfile(input: ProfileUpdateInput): Promise<SessionUser>
  uploadAvatar(localPath: string): Promise<{ key: string }>
}
