import type { SessionPort, SessionUser } from '../../../core/session/types'
import type { KvStorage } from '../../../core/storage/kv'
import { StorageKeys } from '../../../core/storage/keys'
import type { AuthRepository } from '../domain/ports'

function randomId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID().replace(/-/g, '').slice(0, 16)
  }
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`
}

/**
 * Web login uses server dev code path: code `dev:<deviceId>`
 * (see city-quest-server code2Session when appId=dev or code starts with dev:).
 */
export function createLogin(deps: {
  authRepo: AuthRepository
  session: SessionPort
  kv: KvStorage
}) {
  return async function login(options?: {
    nickname?: string
  }): Promise<SessionUser> {
    let deviceId = deps.kv.getJson<string>(StorageKeys.webDeviceId)
    if (!deviceId || typeof deviceId !== 'string') {
      deviceId = randomId()
      deps.kv.setJson(StorageKeys.webDeviceId, deviceId)
    }
    const code = `dev:web_${deviceId}`
    const { token, user } = await deps.authRepo.loginWithWechat({
      code,
      nickname: options?.nickname ?? '探秘用户',
    })
    deps.session.setSession(token, user)
    return user
  }
}

export function createLogout(session: SessionPort) {
  return function logout(): void {
    session.clear()
  }
}
