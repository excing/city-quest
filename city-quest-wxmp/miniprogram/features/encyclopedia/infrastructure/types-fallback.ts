/**
 * Local fallback when types asset fails.
 * Callers: encyclopedia-repository.
 */

import type { EncyclopediaType } from '../domain/entities'
import { DEFAULT_ENCYCLOPEDIA_TYPES } from '../domain/type-defaults'

export const FALLBACK_ENCYCLOPEDIA_TYPES: readonly EncyclopediaType[] =
  DEFAULT_ENCYCLOPEDIA_TYPES
