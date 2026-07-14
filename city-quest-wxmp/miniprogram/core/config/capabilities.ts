/**
 * Capability flags — local defaults; remote merge can plug in later.
 * Callers: composition / features that gate optional UI.
 */

export interface Capabilities {
  /** Reserved: multi-city context. Default off. */
  multiCity: boolean
}

const DEFAULTS: Capabilities = {
  multiCity: false,
}

let current: Capabilities = { ...DEFAULTS }

export function getCapabilities(): Capabilities {
  return { ...current }
}

/** Replace flags (e.g. after remote config). Immutable merge. */
export function setCapabilities(partial: Partial<Capabilities>): void {
  current = { ...current, ...partial }
}

export function resetCapabilitiesForTests(): void {
  current = { ...DEFAULTS }
}
