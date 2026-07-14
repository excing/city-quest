/**
 * Versioned storage keys.
 * Callers: core/session, feature infrastructure.
 */

import { STORAGE_NS } from '../config/constants'

export const StorageKeys = {
  token: `${STORAGE_NS}/token`,
  user: `${STORAGE_NS}/user`,
  browseHistory: `${STORAGE_NS}/browse-history`,
} as const
