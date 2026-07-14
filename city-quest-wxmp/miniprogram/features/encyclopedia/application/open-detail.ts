/**
 * Use case: open detail + record local browse history.
 * Callers: detail presentation.
 */

import type { EncyclopediaDetail } from '../domain/entities'
import type {
  BrowseHistoryRepository,
  EncyclopediaRepository,
} from '../domain/ports'

export function createOpenDetail(
  encyclopediaRepo: EncyclopediaRepository,
  browseRepo: BrowseHistoryRepository,
) {
  return async function openDetail(id: string): Promise<EncyclopediaDetail> {
    const detail = await encyclopediaRepo.getById(id)
    browseRepo.upsert({
      id: detail.id,
      name: detail.name,
      typeKey: detail.typeKey,
      coverUrl: detail.coverUrl ?? null,
      intro: detail.intro,
    })
    return detail
  }
}
