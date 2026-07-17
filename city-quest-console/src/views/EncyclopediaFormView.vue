<script setup lang="ts">
/**
 * Callers: router new/edit. API: create/update/delete + types + uploads.
 * User: 开始阶段B 和 C, 完成产品闭环.
 */
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ApiError,
  createEncyclopedia,
  deleteEncyclopedia,
  fetchAdminEncyclopedia,
  fetchAdminTypes,
  updateEncyclopedia,
  type EncyclopediaType,
} from '../api/client'
import ImageUploader from '../components/ImageUploader.vue'
import MapPicker from '../components/MapPicker.vue'
import TagInput from '../components/TagInput.vue'
import { ENCYCLOPEDIA_TYPES } from '../config/encyclopedia-types'
import { useAuthStore } from '../stores/auth'
import { parseLngLatText } from '../utils/coord'

const props = defineProps<{ id?: string }>()
const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const isEdit = computed(() => Boolean(props.id || route.params.id))
const encyclopediaId = computed(() => (props.id || (route.params.id as string) || '').toString())

const types = ref<EncyclopediaType[]>([...ENCYCLOPEDIA_TYPES])
const loading = ref(isEdit.value)
const saving = ref(false)
const error = ref('')

const form = reactive({
  name: '',
  typeKey: 'scenic',
  lng: '100.19',
  lat: '25.69',
  intro: '',
  address: '',
  businessHours: '',
  avgPrice: '',
  phone: '',
  tags: [] as string[],
  images: [] as string[],
  status: 'unpublished' as 'published' | 'unpublished',
})

onMounted(async () => {
  if (auth.token) {
    try {
      types.value = await fetchAdminTypes(auth.token)
    } catch {
      types.value = [...ENCYCLOPEDIA_TYPES]
    }
  }
  if (isEdit.value && auth.token) {
    try {
      const row = await fetchAdminEncyclopedia(auth.token, encyclopediaId.value)
      form.name = row.name
      form.typeKey = row.typeKey
      form.lng = String(row.lng)
      form.lat = String(row.lat)
      form.intro = row.intro
      form.address = row.address ?? ''
      form.businessHours = row.businessHours ?? ''
      form.avgPrice = row.avgPrice ?? ''
      form.phone = row.phone ?? ''
      form.tags = [...(row.tags ?? [])]
      form.images = [...(row.images ?? [])]
      form.status = row.status === 'published' ? 'published' : 'unpublished'
    } catch (e) {
      error.value = e instanceof ApiError ? e.message : '加载失败'
    } finally {
      loading.value = false
    }
  } else {
    loading.value = false
  }
})

async function onSave() {
  if (!auth.token) return
  error.value = ''
  const coords = parseLngLatText(form.lng, form.lat)
  if (!form.name.trim() || !form.intro.trim() || !coords) {
    error.value = '请填写名称、介绍与有效经纬度（GCJ-02）'
    return
  }
  saving.value = true
  const payload = {
    name: form.name.trim(),
    typeKey: form.typeKey,
    lng: coords.lng,
    lat: coords.lat,
    intro: form.intro.trim(),
    address: form.address.trim() || null,
    businessHours: form.businessHours.trim() || null,
    avgPrice: form.avgPrice.trim() || null,
    phone: form.phone.trim() || null,
    tags: form.tags,
    images: form.images,
    status: form.status,
  }
  try {
    if (isEdit.value) {
      await updateEncyclopedia(auth.token, encyclopediaId.value, payload)
    } else {
      await createEncyclopedia(auth.token, payload)
    }
    await router.push({ name: 'encyclopedias' })
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : '保存失败'
  } finally {
    saving.value = false
  }
}

async function onDelete() {
  if (!auth.token || !isEdit.value) return
  if (!confirm('确定删除该百科？相关收藏将一并删除。')) return
  try {
    await deleteEncyclopedia(auth.token, encyclopediaId.value)
    await router.push({ name: 'encyclopedias' })
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : '删除失败'
  }
}
</script>

<template>
  <div class="mx-auto max-w-3xl">
    <div class="mb-6 flex items-center justify-between">
      <h1 class="text-2xl font-semibold">{{ isEdit ? '编辑百科' : '新建百科' }}</h1>
      <button type="button" class="text-sm text-ink-secondary hover:underline" @click="router.back()">
        取消
      </button>
    </div>

    <p v-if="loading" class="text-ink-secondary">加载中…</p>

    <form v-else class="space-y-5 rounded-xl border border-line bg-surface p-6" @submit.prevent="onSave">
      <div v-if="error" class="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">{{ error }}</div>

      <div>
        <label class="text-sm font-medium">名称 *</label>
        <input v-model="form.name" required class="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm" />
      </div>

      <div>
        <label class="text-sm font-medium">类型 *</label>
        <select v-model="form.typeKey" class="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm">
          <option v-for="t in types" :key="t.key" :value="t.key">{{ t.name }}</option>
        </select>
      </div>

      <div>
        <label class="text-sm font-medium">位置 *</label>
        <div class="mt-1 grid grid-cols-2 gap-4">
          <div>
            <label for="poi-lng" class="text-xs text-ink-secondary">经度（GCJ-02）</label>
            <input
              id="poi-lng"
              v-model="form.lng"
              required
              inputmode="decimal"
              class="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label for="poi-lat" class="text-xs text-ink-secondary">纬度（GCJ-02）</label>
            <input
              id="poi-lat"
              v-model="form.lat"
              required
              inputmode="decimal"
              class="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div class="mt-3">
          <MapPicker v-model:lng="form.lng" v-model:lat="form.lat" />
        </div>
      </div>

      <div>
        <label class="text-sm font-medium">介绍 *</label>
        <textarea
          v-model="form.intro"
          required
          rows="5"
          class="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label class="text-sm font-medium">地址</label>
        <input v-model="form.address" class="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm" />
      </div>

      <div class="grid grid-cols-3 gap-4">
        <div>
          <label class="text-sm font-medium">营业时间</label>
          <input v-model="form.businessHours" class="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm" />
        </div>
        <div>
          <label class="text-sm font-medium">人均</label>
          <input v-model="form.avgPrice" class="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm" />
        </div>
        <div>
          <label class="text-sm font-medium">电话</label>
          <input v-model="form.phone" class="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm" />
        </div>
      </div>

      <div>
        <label class="text-sm font-medium">标签</label>
        <div class="mt-1">
          <TagInput v-model="form.tags" />
        </div>
      </div>

      <div>
        <label class="text-sm font-medium">图片</label>
        <div class="mt-1">
          <ImageUploader v-model="form.images" />
        </div>
      </div>

      <fieldset>
        <legend class="text-sm font-medium">状态</legend>
        <div class="mt-2 flex gap-6 text-sm">
          <label class="inline-flex items-center gap-2">
            <input v-model="form.status" type="radio" value="unpublished" />
            下架
          </label>
          <label class="inline-flex items-center gap-2">
            <input v-model="form.status" type="radio" value="published" />
            上架
          </label>
        </div>
      </fieldset>

      <div class="flex items-center justify-between border-t border-line pt-4">
        <button
          v-if="isEdit"
          type="button"
          class="text-sm text-danger hover:underline"
          @click="onDelete"
        >
          删除
        </button>
        <div v-else />
        <button
          type="submit"
          class="rounded-md bg-primary px-5 py-2 text-sm font-medium text-white hover:bg-primary-pressed disabled:opacity-60"
          :disabled="saving"
        >
          {{ saving ? '保存中…' : '保存' }}
        </button>
      </div>
    </form>
  </div>
</template>
