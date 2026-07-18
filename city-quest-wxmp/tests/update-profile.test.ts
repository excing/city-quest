import { describe, expect, it, vi } from 'vitest'
import {
  createLoadProfile,
  createUpdateProfile,
  isValidPhone,
} from '../miniprogram/features/account/application/update-profile'
import type { SessionPort, SessionUser } from '../miniprogram/core/session/types'
import type { ProfileRepository } from '../miniprogram/features/account/domain/ports'

function createSessionStub(initial?: {
  token?: string | null
  user?: SessionUser | null
}): SessionPort {
  let token: string | null = initial?.token ?? 'jwt-1'
  let user: SessionUser | null = initial?.user ?? {
    id: 'user-1',
    nickname: '旧昵称',
    avatarUrl: null,
    phone: null,
  }
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

describe('isValidPhone', () => {
  it('allows empty', () => {
    expect(isValidPhone('')).toBe(true)
  })

  it('accepts 11-digit mainland mobile', () => {
    expect(isValidPhone('13800138000')).toBe(true)
  })

  it('rejects invalid formats', () => {
    expect(isValidPhone('123')).toBe(false)
    expect(isValidPhone('23800138000')).toBe(false)
    expect(isValidPhone('1380013800a')).toBe(false)
  })
})

describe('createUpdateProfile', () => {
  it('validates nickname and phone before calling repo', async () => {
    const session = createSessionStub()
    const profileRepo: ProfileRepository = {
      getProfile: vi.fn(),
      updateProfile: vi.fn(),
      uploadAvatar: vi.fn(),
    }
    const updateProfile = createUpdateProfile({ profileRepo, session })

    await expect(
      updateProfile({ nickname: '  ', phone: '' }),
    ).rejects.toThrow('请填写昵称')

    await expect(
      updateProfile({ nickname: '探秘', phone: '123' }),
    ).rejects.toThrow('手机号格式不正确')

    expect(profileRepo.updateProfile).not.toHaveBeenCalled()
  })

  it('uploads avatar when local path provided then patches profile', async () => {
    const session = createSessionStub()
    const uploadAvatar = vi.fn(async () => ({
      key: 'avatars/2026/07/a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg',
    }))
    const updateProfileApi = vi.fn(
      async (): Promise<SessionUser> => ({
        id: 'user-1',
        nickname: '新昵称',
        avatarUrl: 'avatars/2026/07/a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg',
        phone: '13800138000',
      }),
    )
    const profileRepo: ProfileRepository = {
      getProfile: vi.fn(),
      updateProfile: updateProfileApi,
      uploadAvatar,
    }
    const updateProfile = createUpdateProfile({ profileRepo, session })

    const user = await updateProfile({
      nickname: '新昵称',
      phone: '13800138000',
      localAvatarPath: 'wxfile://tmp/avatar.jpg',
    })

    expect(uploadAvatar).toHaveBeenCalledWith('wxfile://tmp/avatar.jpg')
    expect(updateProfileApi).toHaveBeenCalledWith({
      nickname: '新昵称',
      phone: '13800138000',
      avatarKey: 'avatars/2026/07/a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg',
    })
    expect(user.nickname).toBe('新昵称')
    expect(session.getUser()?.phone).toBe('13800138000')
  })

  it('skips upload when no local avatar path', async () => {
    const session = createSessionStub()
    const uploadAvatar = vi.fn()
    const updateProfileApi = vi.fn(
      async (): Promise<SessionUser> => ({
        id: 'user-1',
        nickname: '仅昵称',
        avatarUrl: null,
        phone: null,
      }),
    )
    const profileRepo: ProfileRepository = {
      getProfile: vi.fn(),
      updateProfile: updateProfileApi,
      uploadAvatar,
    }
    const updateProfile = createUpdateProfile({ profileRepo, session })

    await updateProfile({ nickname: '仅昵称', phone: '' })

    expect(uploadAvatar).not.toHaveBeenCalled()
    expect(updateProfileApi).toHaveBeenCalledWith({
      nickname: '仅昵称',
      phone: null,
    })
  })
})

describe('createLoadProfile', () => {
  it('fetches and stores user in session', async () => {
    const session = createSessionStub()
    const getProfile = vi.fn(
      async (): Promise<SessionUser> => ({
        id: 'user-1',
        nickname: '服务端昵称',
        avatarUrl: 'avatars/2026/07/a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg',
        phone: '13900000000',
      }),
    )
    const profileRepo: ProfileRepository = {
      getProfile,
      updateProfile: vi.fn(),
      uploadAvatar: vi.fn(),
    }
    const loadProfile = createLoadProfile({ profileRepo, session })

    const user = await loadProfile()
    expect(user.nickname).toBe('服务端昵称')
    expect(session.getUser()?.phone).toBe('13900000000')
  })
})
