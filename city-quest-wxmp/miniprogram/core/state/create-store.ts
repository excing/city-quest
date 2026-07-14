/**
 * Replaceable in-memory store port.
 * Callers: session and future feature stores. Swap impl without changing callers.
 */

export interface Store<S> {
  getState(): S
  setState(reducer: (prev: S) => S): void
  subscribe(listener: () => void): () => void
}

export function createStore<S>(initial: S): Store<S> {
  let state = initial
  const listeners = new Set<() => void>()

  return {
    getState(): S {
      return state
    },
    setState(reducer: (prev: S) => S): void {
      const next = reducer(state)
      if (Object.is(next, state)) return
      state = next
      listeners.forEach((l) => l())
    },
    subscribe(listener: () => void): () => void {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
}
