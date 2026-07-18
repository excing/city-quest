import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createWxKvStorage } from '../miniprogram/core/storage/kv'
import { createSession } from '../miniprogram/core/session/session'
import { StorageKeys } from '../miniprogram/core/storage/keys'

type StorageMap = Map<string, unknown>

function installWxStorageMock(initial?: StorageMap) {
  const map: StorageMap = initial ?? new Map()
  const wxMock = {
    getStorageSync: vi.fn((key: string) => {
      if (!map.has(key)) return ''
      return map.get(key)
    }),
    setStorageSync: vi.fn((key: string, value: unknown) => {
      map.set(key, value)
    }),
    removeStorageSync: vi.fn((key: string) => {
      map.delete(key)
    }),
  }
  ;(globalThis as { wx?: typeof wxMock }).wx = wxMock
  return { map, wxMock }
}

describe('createWxKvStorage', () => {
  beforeEach(() => {
    delete (globalThis as { wx?: unknown }).wx
  })

  it('round-trips JWT-like string tokens via JSON encoding', () => {
    const { map } = installWxStorageMock()
    const kv = createWxKvStorage()
    const token =
      'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyLTEifQ.signature'

    kv.setJson(StorageKeys.token, token)

    expect(map.get(StorageKeys.token)).toBe(JSON.stringify(token))
    expect(kv.getJson<string>(StorageKeys.token)).toBe(token)
  })

  it('round-trips objects', () => {
    installWxStorageMock()
    const kv = createWxKvStorage()
    const user = { id: 'user-1', nickname: 'Ada', avatarUrl: null }

    kv.setJson(StorageKeys.user, user)

    expect(kv.getJson<typeof user>(StorageKeys.user)).toEqual(user)
  })

  it('returns null for invalid JSON strings', () => {
    const token = 'eyJhbGciOiJIUzI1NiJ9.not-json.token'
    installWxStorageMock(new Map([[StorageKeys.token, token]]))
    const kv = createWxKvStorage()

    expect(kv.getJson<string>(StorageKeys.token)).toBeNull()
  })
})

describe('session persistence across restart', () => {
  beforeEach(() => {
    delete (globalThis as { wx?: unknown }).wx
  })

  it('hydrates token and user after process kill (new storage instance)', () => {
    const { map } = installWxStorageMock()
    const kv1 = createWxKvStorage()
    const session1 = createSession({ kv: kv1 })
    session1.setSession('jwt-persist-1', {
      id: 'user-1',
      nickname: 'Ada',
      avatarUrl: null,
    })

    // Simulate kill + relaunch: new session, same underlying storage map
    const kv2 = createWxKvStorage()
    const session2 = createSession({ kv: kv2 })
    session2.hydrate()

    expect(session2.isLoggedIn()).toBe(true)
    expect(session2.getToken()).toBe('jwt-persist-1')
    expect(session2.getUser()?.id).toBe('user-1')
    expect(map.get(StorageKeys.token)).toBe(JSON.stringify('jwt-persist-1'))
  })
})
