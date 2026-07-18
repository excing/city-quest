/**
 * Thin typed JSON storage adapter over wx storage.
 * Callers: session, feature infrastructure. No business rules.
 */

export interface KvStorage {
  getJson<T>(key: string): T | null
  setJson(key: string, value: unknown): void
  remove(key: string): void
}

export function createWxKvStorage(): KvStorage {
  return {
    getJson<T>(key: string): T | null {
      try {
        const raw = wx.getStorageSync(key)
        if (raw === '' || raw === undefined || raw === null) return null
        if (typeof raw !== 'string') return null
        return JSON.parse(raw) as T
      } catch {
        return null
      }
    },
    setJson(key: string, value: unknown): void {
      wx.setStorageSync(key, JSON.stringify(value))
    },
    remove(key: string): void {
      try {
        wx.removeStorageSync(key)
      } catch {
        // ignore
      }
    },
  }
}

/** In-memory KV for unit tests (no wx). */
export function createMemoryKvStorage(): KvStorage {
  const map = new Map<string, unknown>()
  return {
    getJson<T>(key: string): T | null {
      if (!map.has(key)) return null
      return map.get(key) as T
    },
    setJson(key: string, value: unknown): void {
      map.set(key, value)
    },
    remove(key: string): void {
      map.delete(key)
    },
  }
}
