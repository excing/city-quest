<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getAppContext } from '../app-context'
import { fileUrl } from '../core/config/env'
import type { BrowseHistoryItem } from '../features/encyclopedia/public'
import {
  buildTypeMap,
  detailUrl,
  EncyclopediaRoutes,
  typeColorOf,
  typeNameOf,
} from '../features/encyclopedia/public'
import ListCover from '../components/ListCover.vue'
import PageHeader from '../components/PageHeader.vue'
import { confirmDialog, showToast } from '../shared/lib/toast'

interface HistoryRow {
  id: string
  name: string
  typeName: string
  typeColor: string
  intro: string
  coverUrl: string
  viewedAtLabel: string
}

const router = useRouter()
const items = ref<HistoryRow[]>([])
const empty = ref(true)

function formatViewedAt(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const mm = `${d.getMonth() + 1}`.padStart(2, '0')
  const dd = `${d.getDate()}`.padStart(2, '0')
  const hh = `${d.getHours()}`.padStart(2, '0')
  const mi = `${d.getMinutes()}`.padStart(2, '0')
  return `${mm}-${dd} ${hh}:${mi}`
}

function toRows(list: BrowseHistoryItem[]): HistoryRow[] {
  const typeMap = buildTypeMap(getAppContext().getEncyclopediaTypes())
  return list.map((item) => ({
    id: item.id,
    name: item.name,
    typeName: typeNameOf(item.typeKey, typeMap),
    typeColor: typeColorOf(item.typeKey, typeMap),
    intro: item.intro || '',
    coverUrl: fileUrl(item.coverKey),
    viewedAtLabel: formatViewedAt(item.viewedAt),
  }))
}

function reload() {
  const list = getAppContext().listBrowseHistory()
  const rows = toRows(list)
  items.value = rows
  empty.value = rows.length === 0
}

function onOpen(id: string) {
  void router.push(detailUrl(id))
}

async function onClear() {
  if (empty.value) return
  const ok = await confirmDialog({
    title: '清空浏览记录',
    content: '确定清空全部浏览记录？此操作不可恢复。',
    confirmText: '清空',
    cancelText: '取消',
  })
  if (!ok) return
  getAppContext().clearBrowseHistory()
  reload()
  showToast('已清空')
}

function goMap() {
  void router.push(EncyclopediaRoutes.map)
}

onMounted(reload)
</script>

<template>
  <div class="history-page cq-page cq-safe-bottom">
    <PageHeader title="浏览记录">
      <template v-if="!empty" #action>
        <button type="button" class="history-clear" @click="onClear">
          清空
        </button>
      </template>
    </PageHeader>

    <div v-if="empty" class="cq-empty">
      <div class="cq-empty__title">还没有浏览记录</div>
      <div class="cq-empty__desc">打开地点详情后，会自动记在这里</div>
      <button type="button" class="cq-btn-ghost" @click="goMap">去地图看看</button>
    </div>

    <div v-else class="history-list">
      <button
        v-for="item in items"
        :key="item.id"
        type="button"
        class="history-row"
        @click="onOpen(item.id)"
      >
        <ListCover
          :src="item.coverUrl"
          :name="item.name"
          :type-color="item.typeColor"
        />
        <div class="history-main">
          <div class="history-name">{{ item.name }}</div>
          <div class="history-sub">
            <span
              class="cq-type-dot"
              :style="{ background: item.typeColor }"
            />
            <span>{{ item.typeName }}</span>
            <span v-if="item.viewedAtLabel" class="history-time">
              · {{ item.viewedAtLabel }}
            </span>
          </div>
        </div>
        <span class="cq-list-cell__chevron">›</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.history-clear {
  font-size: 14px;
  color: var(--color-primary);
}

.history-list {
  padding: 0 16px 24px;
}

.history-row {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 0;
  border-bottom: 1px solid var(--color-line);
  text-align: left;
}

.history-row:active {
  opacity: 0.85;
}

.history-main {
  flex: 1;
  min-width: 0;
}

.history-name {
  font-size: 16px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-sub {
  margin-top: 4px;
  font-size: 13px;
  color: var(--color-ink-secondary);
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.history-time {
  color: var(--color-ink-muted);
}
</style>
