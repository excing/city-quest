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
    const coverKey =
      detail.coverKey ??
      (detail.images?.length ? detail.images[0] : null) ??
      null
    browseRepo.upsert({
      id: detail.id,
      name: detail.name,
      typeKey: detail.typeKey,
      coverKey,
      intro: detail.intro,
    })
    return detail
  }
}
