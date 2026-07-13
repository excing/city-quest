<script setup lang="ts">
/**
 * Callers: router /encyclopedias. API: GET/PATCH admin encyclopedias.
 * User: 开始阶段B 和 C, 完成产品闭环.
 */
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  ApiError,
  fetchAdminEncyclopedias,
  fetchAdminTypes,
  updateEncyclopedia,
  type AdminEncyclopedia,
  type EncyclopediaType,
} from '../api/client'
import { ENCYCLOPEDIA_TYPES } from '../config/encyclopedia-types'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()
const items = ref<AdminEncyclopedia[]>([])
const types = ref<EncyclopediaType[]>([...ENCYCLOPEDIA_TYPES])
const loading = ref(true)
const error = ref('')
const statusFilter = ref('')
const page = ref(1)
const pageSize = 20
const total = ref(0)

function typeLabel(key: string) {
  return types.value.find((t) => t.key === key)?.name ?? key
}
function typeColor(key: string) {
  return types.value.find((t) => t.key === key)?.color ?? '#2B4C7E'
}

async function load() {
  if (!auth.token) return
  loading.value = true
  error.value = ''
  try {
    try {
      types.value = await fetchAdminTypes(auth.token)
    } catch {
      types.value = [...ENCYCLOPEDIA_TYPES]
    }
    const result = await fetchAdminEncyclopedias(auth.token, {
      page: page.value,
      pageSize,
      status: statusFilter.value || undefined,
    })
    items.value = result.items
    total.value = result.total
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
}

async function toggleStatus(row: AdminEncyclopedia) {
  if (!auth.token) return
  const next = row.status === 'published' ? 'unpublished' : 'published'
  try {
    await updateEncyclopedia(auth.token, row.id, {
      status: next as 'published' | 'unpublished',
    })
    await load()
  } catch (e) {
    alert(e instanceof ApiError ? e.message : '操作失败')
  }
}

const totalPages = () => Math.max(1, Math.ceil(total.value / pageSize))

function onFilterChange() {
  page.value = 1
  void load()
}

onMounted(() => {
  void load()
})
</script>

<template>
  <div class="mx-auto max-w-6xl">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h1 class="text-2xl font-semibold">百科</h1>
      <div class="flex items-center gap-3">
        <select
          v-model="statusFilter"
          class="rounded-md border border-line bg-white px-3 py-2 text-sm"
          @change="onFilterChange"
        >
          <option value="">全部状态</option>
          <option value="published">已上架</option>
          <option value="unpublished">已下架</option>
        </select>
        <button
          type="button"
          class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-pressed"
          @click="router.push({ name: 'encyclopedia-new' })"
        >
          新建
        </button>
      </div>
    </div>

    <p v-if="error" class="mt-4 text-sm text-danger">{{ error }}</p>
    <p v-if="loading" class="mt-8 text-ink-secondary">加载中…</p>

    <div
      v-else-if="items.length === 0"
      class="mt-10 rounded-lg border border-line bg-surface p-10 text-center text-ink-secondary"
    >
      还没有百科，点击新建
    </div>

    <div v-else class="mt-6 overflow-hidden rounded-lg border border-line bg-surface">
      <table class="min-w-full text-left text-sm">
        <thead class="bg-fill/60 text-ink-secondary">
          <tr>
            <th class="px-4 py-3 font-medium">名称</th>
            <th class="px-4 py-3 font-medium">类型</th>
            <th class="px-4 py-3 font-medium">状态</th>
            <th class="px-4 py-3 font-medium">更新时间</th>
            <th class="px-4 py-3 font-medium">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in items" :key="row.id" class="border-t border-line">
            <td class="px-4 py-3 font-medium">{{ row.name }}</td>
            <td class="px-4 py-3">
              <span class="inline-flex items-center gap-1">
                <span :style="{ color: typeColor(row.typeKey) }">●</span>
                {{ typeLabel(row.typeKey) }}
              </span>
            </td>
            <td class="px-4 py-3">
              <span
                class="rounded-full px-2 py-0.5 text-xs"
                :class="
                  row.status === 'published'
                    ? 'bg-primary-soft text-primary'
                    : 'bg-fill text-ink-muted'
                "
              >
                {{ row.status === 'published' ? '已上架' : '已下架' }}
              </span>
            </td>
            <td class="px-4 py-3 tabular-nums text-ink-secondary">
              {{ row.updatedAt.slice(0, 19).replace('T', ' ') }}
            </td>
            <td class="space-x-3 px-4 py-3">
              <button
                type="button"
                class="text-primary hover:underline"
                @click="router.push({ name: 'encyclopedia-edit', params: { id: row.id } })"
              >
                编辑
              </button>
              <button type="button" class="text-primary hover:underline" @click="toggleStatus(row)">
                {{ row.status === 'published' ? '下架' : '上架' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="total > pageSize" class="mt-4 flex items-center justify-end gap-3 text-sm">
      <button
        type="button"
        class="rounded border border-line px-3 py-1 disabled:opacity-40"
        :disabled="page <= 1"
        @click="page--; load()"
      >
        上一页
      </button>
      <span class="text-ink-secondary">{{ page }} / {{ totalPages() }}</span>
      <button
        type="button"
        class="rounded border border-line px-3 py-1 disabled:opacity-40"
        :disabled="page >= totalPages()"
        @click="page++; load()"
      >
        下一页
      </button>
    </div>
  </div>
</template>
