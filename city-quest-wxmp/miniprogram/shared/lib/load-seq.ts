/**
 * Monotonic load sequence to ignore stale async setData.
 * Callers: page controllers (presentation).
 */

export function createLoadSeq(): {
  next: () => number
  isCurrent: (seq: number) => boolean
} {
  let current = 0
  return {
    next(): number {
      current += 1
      return current
    },
    isCurrent(seq: number): boolean {
      return seq === current
    },
  }
}
