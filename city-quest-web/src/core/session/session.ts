/**
 * Session implementation: memory store + kv persistence.
 * Callers: composition root, http, account.
 */

import type { KvStorage } from '../storage/kv'
import { StorageKeys } from '../storage/keys'
import { createStore } from '../state/create-store'
import type { SessionPort, SessionSnapshot, SessionUser } from './types'

export interface CreateSessionDeps {
  kv: KvStorage
}

export function createSession(deps: CreateSessionDeps): SessionPort {
  const store = createStore<SessionSnapshot>({ token: null, user: null })

  function persist(snapshot: SessionSnapshot): void {
    if (snapshot.token) {
      deps.kv.setJson(StorageKeys.token, snapshot.token)
    } else {
      deps.kv.remove(StorageKeys.token)
    }
    if (snapshot.user) {
      deps.kv.setJson(StorageKeys.user, snapshot.user)
    } else {
      deps.kv.remove(StorageKeys.user)
    }
  }

  return {
    hydrate(): void {
      const token = deps.kv.getJson<string>(StorageKeys.token)
      const user = deps.kv.getJson<SessionUser>(StorageKeys.user)
      store.setState(() => ({
        token: typeof token === 'string' ? token : null,
        user: user && typeof user.id === 'string' ? user : null,
      }))
    },
    getToken(): string | null {
      return store.getState().token
    },
    getUser(): SessionUser | null {
      return store.getState().user
    },
    isLoggedIn(): boolean {
      return Boolean(store.getState().token)
    },
    setSession(token: string, user: SessionUser): void {
      const next = { token, user }
      store.setState(() => next)
      persist(next)
    },
    clear(): void {
      const next = { token: null, user: null }
      store.setState(() => next)
      persist(next)
    },
    subscribe(listener: () => void): () => void {
      return store.subscribe(listener)
    },
    getSnapshot(): SessionSnapshot {
      const s = store.getState()
      return { token: s.token, user: s.user }
    },
  }
}
