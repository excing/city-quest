/**
 * Composition root wiring — single place to assemble core + features.
 * Callers: app.ts, thin pages via getAppContext().
 */

import { createHttpClient } from './core/http/client'
import { createSession } from './core/session/session'
import type { SessionPort } from './core/session/types'
import { createWxKvStorage } from './core/storage/kv'
import {
  createAddFavorite,
  createBrowseHistoryRepository,
  createCachedEncyclopediaRepository,
  createEncyclopediaRepository,
  createFavoriteRepository,
  createListFavorites,
  createLoadMapPoints,
  createOpenDetail,
  createRemoveFavorite,
  type EncyclopediaType,
} from './features/encyclopedia/public'
import {
  createAuthRepository,
  createEnsureAuthenticated,
  createLogin,
  createLogout,
} from './features/account/public'

export interface AppContext {
  session: SessionPort
  loadMapPoints: ReturnType<typeof createLoadMapPoints>
  openDetail: ReturnType<typeof createOpenDetail>
  listFavorites: ReturnType<typeof createListFavorites>
  addFavorite: ReturnType<typeof createAddFavorite>
  removeFavorite: ReturnType<typeof createRemoveFavorite>
  listBrowseHistory: () => ReturnType<
    ReturnType<typeof createBrowseHistoryRepository>['list']
  >
  clearBrowseHistory: () => void
  ensureAuthenticated: ReturnType<typeof createEnsureAuthenticated>
  login: ReturnType<typeof createLogin>
  logout: ReturnType<typeof createLogout>
  /** Shared remote types for map + detail (populated by loadMapPoints). */
  getEncyclopediaTypes: () => EncyclopediaType[]
  setEncyclopediaTypes: (types: EncyclopediaType[]) => void
}

let ctx: AppContext | null = null

export function createAppContext(): AppContext {
  const kv = createWxKvStorage()
  const session = createSession({ kv })
  session.hydrate()

  const http = createHttpClient({ session })
  const remoteRepo = createEncyclopediaRepository(http)
  const encyclopediaRepo = createCachedEncyclopediaRepository(remoteRepo)
  const favoriteRepo = createFavoriteRepository(http)
  const browseRepo = createBrowseHistoryRepository(kv)
  const authRepo = createAuthRepository(http)
  const login = createLogin({ authRepo, session })

  let encyclopediaTypes: EncyclopediaType[] = []

  return {
    session,
    loadMapPoints: createLoadMapPoints(encyclopediaRepo, {
      invalidateCache: (scope) => encyclopediaRepo.invalidateCache(scope),
    }),
    openDetail: createOpenDetail(encyclopediaRepo, browseRepo),
    listFavorites: createListFavorites(favoriteRepo),
    addFavorite: createAddFavorite(favoriteRepo),
    removeFavorite: createRemoveFavorite(favoriteRepo),
    listBrowseHistory: () => browseRepo.list(),
    clearBrowseHistory: () => browseRepo.clear(),
    ensureAuthenticated: createEnsureAuthenticated({ session, login }),
    login,
    logout: createLogout(session),
    getEncyclopediaTypes: () => encyclopediaTypes.map((t) => ({ ...t })),
    setEncyclopediaTypes: (types) => {
      encyclopediaTypes = types.map((t) => ({ ...t }))
    },
  }
}

export function initAppContext(): AppContext {
  ctx = createAppContext()
  return ctx
}

export function getAppContext(): AppContext {
  if (!ctx) {
    ctx = createAppContext()
  }
  return ctx
}
