/**
 * Thin typed JSON storage adapter over localStorage.
 * Callers: session, feature infrastructure. No business rules.
 */

export interface KvStorage {
  getJson<T>(key: string): T | null
  setJson(key: string, value: unknown): void
  remove(key: string): void
}

export function createLocalKvStorage(): KvStorage {
  return {
    getJson<T>(key: string): T | null {
      try {
        const raw = localStorage.getItem(key)
        if (raw === null || raw === '') return null
        return JSON.parse(raw) as T
      } catch {
        return null
      }
    },
    setJson(key: string, value: unknown): void {
      localStorage.setItem(key, JSON.stringify(value))
    },
    remove(key: string): void {
      try {
        localStorage.removeItem(key)
      } catch {
        // ignore
      }
    },
  }
}

/** In-memory KV for unit tests. */
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
