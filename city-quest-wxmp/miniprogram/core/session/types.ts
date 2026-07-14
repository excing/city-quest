/**
 * Session port — identity cross-cutting concern.
 * Callers: http client, account feature, pages via account public API.
 */

export interface SessionUser {
  id: string
  nickname?: string | null
  avatarUrl?: string | null
}

export interface SessionSnapshot {
  token: string | null
  user: SessionUser | null
}

export interface SessionPort {
  hydrate(): void
  getToken(): string | null
  getUser(): SessionUser | null
  isLoggedIn(): boolean
  setSession(token: string, user: SessionUser): void
  clear(): void
  subscribe(listener: () => void): () => void
  getSnapshot(): SessionSnapshot
}
