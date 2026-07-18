/**
 * Update profile use case: optional avatar upload + POST /me + session sync.
 * Callers: profile page via app-context.
 */

import type { SessionPort, SessionUser } from '../../../core/session/types'
import type { ProfileRepository, ProfileUpdateInput } from '../domain/ports'

/** Mainland CN mobile: 1 + 10 digits. Empty allowed (clears server phone). */
export function isValidPhone(phone: string): boolean {
  if (!phone) return true
  return /^1\d{10}$/.test(phone)
}

export function createUpdateProfile(deps: {
  profileRepo: ProfileRepository
  session: SessionPort
}) {
  return async function updateProfile(input: {
    nickname: string
    phone: string
    /** Local temp path when user picked a new avatar; omit to keep current. */
    localAvatarPath?: string | null
  }): Promise<SessionUser> {
    const nickname = input.nickname.trim()
    if (!nickname) {
      throw new Error('请填写昵称')
    }
    if (nickname.length > 64) {
      throw new Error('昵称不能超过 64 个字符')
    }

    const phone = input.phone.trim()
    if (!isValidPhone(phone)) {
      throw new Error('手机号格式不正确')
    }

    const token = deps.session.getToken()
    if (!token) {
      throw new Error('请先登录')
    }

    let avatarKey: string | undefined
    if (input.localAvatarPath) {
      const uploaded = await deps.profileRepo.uploadAvatar(input.localAvatarPath)
      avatarKey = uploaded.key
    }

    const patch: ProfileUpdateInput = {
      nickname,
      phone: phone || null,
    }
    if (avatarKey !== undefined) {
      patch.avatarKey = avatarKey
    }

    const user = await deps.profileRepo.updateProfile(patch)
    deps.session.setSession(token, user)
    return user
  }
}

export function createLoadProfile(deps: {
  profileRepo: ProfileRepository
  session: SessionPort
}) {
  return async function loadProfile(): Promise<SessionUser> {
    const token = deps.session.getToken()
    if (!token) {
      throw new Error('请先登录')
    }
    const user = await deps.profileRepo.getProfile()
    deps.session.setSession(token, user)
    return user
  }
}
