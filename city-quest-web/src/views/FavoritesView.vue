<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getAppContext } from '../app-context'
import { fileUrl } from '../core/config/env'
import { messageFromUnknown } from '../core/error/messages'
import { AccountRoutes } from '../features/account/public'
import type { FavoriteListItem } from '../features/encyclopedia/public'
import {
  buildTypeMap,
  detailUrl,
  EncyclopediaRoutes,
  typeColorOf,
  typeNameOf,
} from '../features/encyclopedia/public'
import ListCover from '../components/ListCover.vue'
import PageHeader from '../components/PageHeader.vue'
import { showToast } from '../shared/lib/toast'

interface FavoriteRow {
  encyclopediaId: string
  name: string
  typeName: string
  typeColor: string
  intro: string
  coverUrl: string
  isUnpublished: boolean
  removing: boolean
}

const router = useRouter()
const items = ref<FavoriteRow[]>([])
const empty = ref(true)
const loading = ref(true)
const error = ref('')

function toRows(list: FavoriteListItem[]): FavoriteRow[] {
  const typeMap = buildTypeMap(getAppContext().getEncyclopediaTypes())
  return list.map((item) => {
    const status = (item.status || '').toLowerCase()
    const isUnpublished =
      status === 'unpublished' || status === 'offline' || status === 'draft'
    return {
      encyclopediaId: item.encyclopediaId,
      name: item.name,
      typeName: typeNameOf(item.typeKey, typeMap),
      typeColor: typeColorOf(item.typeKey, typeMap),
      intro: item.intro || '',
      coverUrl: fileUrl(item.coverKey),
      isUnpublished,
      removing: false,
    }
  })
}

async function reload() {
  loading.value = true
  error.value = ''
  try {
    const list = await getAppContext().listFavorites()
    const rows = toRows(list)
    items.value = rows
    empty.value = rows.length === 0
    loading.value = false
  } catch (e) {
    loading.value = false
    error.value = messageFromUnknown(e)
    items.value = []
    empty.value = true
  }
}

async function bootstrap() {
  const ctx = getAppContext()
  if (!ctx.session.isLoggedIn()) {
    await ctx.ensureAuthenticated()
    if (!ctx.session.isLoggedIn()) {
      void router.replace(AccountRoutes.mine)
      return
    }
  }
  await reload()
}

function onOpen(row: FavoriteRow) {
  if (row.isUnpublished) {
    showToast('该地点已下架，暂时无法查看')
    return
  }
  void router.push(detailUrl(row.encyclopediaId))
}

async function onRemove(row: FavoriteRow) {
  items.value = items.value.map((r) =>
    r.encyclopediaId === row.encyclopediaId ? { ...r, removing: true } : r,
  )
  try {
    await getAppContext().removeFavorite(row.encyclopediaId)
    items.value = items.value.filter(
      (r) => r.encyclopediaId !== row.encyclopediaId,
    )
    empty.value = items.value.length === 0
    showToast('已取消收藏')
  } catch (err) {
    items.value = items.value.map((r) =>
      r.encyclopediaId === row.encyclopediaId ? { ...r, removing: false } : r,
    )
    showToast(messageFromUnknown(err))
  }
}

function goMap() {
  void router.push(EncyclopediaRoutes.map)
}

onMounted(() => {
  void bootstrap()
})
</script>

<template>
  <div class="fav-page cq-page cq-safe-bottom">
    <PageHeader title="我的收藏" />

    <div v-if="loading" class="detail-loading">加载中…</div>

    <div v-else-if="error" class="cq-empty">
      <div class="cq-empty__title">加载失败</div>
      <div class="cq-empty__desc">{{ error }}</div>
      <button type="button" class="cq-btn-ghost" @click="reload">重试</button>
    </div>

    <div v-else-if="empty" class="cq-empty">
      <div class="cq-empty__title">还没有收藏</div>
      <div class="cq-empty__desc">在地点详情中点击「收藏」即可添加</div>
      <button type="button" class="cq-btn-ghost" @click="goMap">去地图看看</button>
    </div>

    <div v-else class="fav-list">
      <div
        v-for="item in items"
        :key="item.encyclopediaId"
        class="fav-row"
        :class="{ 'fav-row--off': item.isUnpublished }"
      >
        <button type="button" class="fav-row__main" @click="onOpen(item)">
          <ListCover
            :src="item.coverUrl"
            :name="item.name"
            :type-color="item.typeColor"
          />
          <div class="fav-info">
            <div class="fav-name">
              {{ item.name }}
              <span v-if="item.isUnpublished" class="cq-badge">已下架</span>
            </div>
            <div class="fav-sub">
              <span
                class="cq-type-dot"
                :style="{ background: item.typeColor }"
              />
              <span>{{ item.typeName }}</span>
            </div>
          </div>
        </button>
        <button
          v-if="item.isUnpublished"
          type="button"
          class="fav-remove"
          :disabled="item.removing"
          @click="onRemove(item)"
        >
          取消收藏
        </button>
        <span v-else class="cq-list-cell__chevron">›</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.detail-loading {
  padding: 40px;
  text-align: center;
  color: var(--color-ink-secondary);
}

.fav-list {
  padding: 0 16px 24px;
}

.fav-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 0;
  border-bottom: 1px solid var(--color-line);
}

.fav-row--off {
  opacity: 0.75;
}

.fav-row__main {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  text-align: left;
}

.fav-info {
  flex: 1;
  min-width: 0;
}

.fav-name {
  font-size: 16px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fav-sub {
  margin-top: 4px;
  font-size: 13px;
  color: var(--color-ink-secondary);
  display: flex;
  align-items: center;
}

.fav-remove {
  flex-shrink: 0;
  font-size: 12px;
  color: var(--color-danger);
  background: var(--color-danger-soft);
  border-radius: var(--radius-pill);
  padding: 6px 10px;
}
</style>
