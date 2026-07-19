/**
 * Versioned storage keys.
 * Callers: core/session, feature infrastructure.
 */

import { STORAGE_NS } from '../config/constants'

export const StorageKeys = {
  token: `${STORAGE_NS}/token`,
  user: `${STORAGE_NS}/user`,
  browseHistory: `${STORAGE_NS}/browse-history`,
  /** Whether map system POI labels are shown (reserved for future layers). */
  mapShowPoi: `${STORAGE_NS}/map-show-poi`,
  /** Web guest / dev login device id (stable openid suffix). */
  webDeviceId: `${STORAGE_NS}/web-device-id`,
} as const
