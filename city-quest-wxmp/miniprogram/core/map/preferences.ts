/**
 * Local map display preferences.
 * Callers: app-context, settings page, map page via getAppContext().
 */

import type { KvStorage } from '../storage/kv'
import { StorageKeys } from '../storage/keys'

/** Default: hide system POI so encyclopedia markers stay uncluttered. */
export const DEFAULT_MAP_SHOW_POI = false

export interface MapPreferences {
  getShowPoi(): boolean
  setShowPoi(show: boolean): void
}

export function createMapPreferences(kv: KvStorage): MapPreferences {
  return {
    getShowPoi(): boolean {
      const stored = kv.getJson<boolean>(StorageKeys.mapShowPoi)
      if (typeof stored !== 'boolean') return DEFAULT_MAP_SHOW_POI
      return stored
    },
    setShowPoi(show: boolean): void {
      kv.setJson(StorageKeys.mapShowPoi, Boolean(show))
    },
  }
}
