<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getAppContext } from '../app-context'
import { fileUrl } from '../core/config/env'
import {
  isHttpError,
  messageFromUnknown,
} from '../core/error/messages'
import type { EncyclopediaDetail } from '../features/encyclopedia/public'
import {
  buildTypeMap,
  EncyclopediaRoutes,
  typeColorOf,
  typeNameOf,
} from '../features/encyclopedia/public'
import PageHeader from '../components/PageHeader.vue'
import { showToast } from '../shared/lib/toast'

interface DetailVm {
  id: string
  name: string
  intro: string
  typeName: string
  typeColor: string
  tags: string[]
  images: string[]
  address: string
  businessHours: string
  avgPrice: string
  phone: string
  hasImages: boolean
  hasAddress: boolean
  hasBusinessHours: boolean
  hasAvgPrice: boolean
  hasPhone: boolean
  hasTags: boolean
  isFavorited: boolean
  lng: number
  lat: number
}

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const error = ref('')
const unavailable = ref(false)
const favoriting = ref(false)
const detail = ref<DetailVm | null>(null)
const galleryIndex = ref(0)

const id = computed(() => String(route.params.id || ''))

function toVm(
  d: EncyclopediaDetail,
  typeMap: Record<string, { key: string; name: string; color: string }>,
): DetailVm {
  const keys =
    d.images?.length > 0 ? d.images : d.coverKey ? [d.coverKey] : []
  const images = keys.map((key) => fileUrl(key)).filter(Boolean)
  const address = d.address?.trim() || ''
  const businessHours = d.businessHours?.trim() || ''
  const avgPrice = d.avgPrice?.trim() || ''
  const phone = d.phone?.trim() || ''
  const tags = (d.tags || []).filter(Boolean)
  return {
    id: d.id,
    name: d.name,
    intro: d.intro,
    typeName: typeNameOf(d.typeKey, typeMap),
    typeColor: typeColorOf(d.typeKey, typeMap),
    tags,
    images,
    address,
    businessHours,
    avgPrice,
    phone,
    hasImages: images.length > 0,
    hasAddress: Boolean(address),
    hasBusinessHours: Boolean(businessHours),
    hasAvgPrice: Boolean(avgPrice),
    hasPhone: Boolean(phone),
    hasTags: tags.length > 0,
    isFavorited: Boolean(d.isFavorited),
    lng: d.lng,
    lat: d.lat,
  }
}

async function load(detailId: string) {
  loading.value = true
  error.value = ''
  unavailable.value = false
  galleryIndex.value = 0
  try {
    const ctx = getAppContext()
    const raw = await ctx.openDetail(detailId)
    const typeMap = buildTypeMap(ctx.getEncyclopediaTypes())
    detail.value = toVm(raw, typeMap)
    loading.value = false
  } catch (e) {
    const is404 = isHttpError(e) && (e.status === 404 || e.code === 'NOT_FOUND')
    loading.value = false
    unavailable.value = true
    error.value = is404
      ? '该地点已下架，暂时无法查看'
      : messageFromUnknown(e)
    detail.value = null
  }
}

async function onToggleFavorite() {
  const d = detail.value
  if (!d || favoriting.value) return

  const ctx = getAppContext()
  const ok = await ctx.ensureAuthenticated()
  if (!ok) return

  favoriting.value = true
  try {
    if (d.isFavorited) {
      await ctx.removeFavorite(d.id)
      detail.value = { ...d, isFavorited: false }
      showToast('已取消收藏')
    } else {
      await ctx.addFavorite(d.id)
      detail.value = { ...d, isFavorited: true }
      showToast('已收藏')
    }
  } catch (e) {
    showToast(messageFromUnknown(e))
  } finally {
    favoriting.value = false
  }
}

function onOpenMap() {
  const d = detail.value
  if (!d) return
  if (!d.hasAddress && !(d.lng && d.lat)) return
  const q = encodeURIComponent(`${d.lat},${d.lng}`)
  const name = encodeURIComponent(d.name)
  // Open OSM / geo as best-effort on web
  window.open(
    `https://www.openstreetmap.org/?mlat=${d.lat}&mlon=${d.lng}#map=16/${d.lat}/${d.lng}&marker=${name}`,
    '_blank',
    'noopener,noreferrer',
  )
  void q
}

function onCall() {
  const phone = detail.value?.phone
  if (!phone) return
  window.location.href = `tel:${phone}`
}

function onBackHome() {
  void router.push(EncyclopediaRoutes.map)
}

function nextImage() {
  const d = detail.value
  if (!d || d.images.length < 2) return
  galleryIndex.value = (galleryIndex.value + 1) % d.images.length
}

function prevImage() {
  const d = detail.value
  if (!d || d.images.length < 2) return
  galleryIndex.value =
    (galleryIndex.value - 1 + d.images.length) % d.images.length
}

onMounted(() => {
  if (!id.value) {
    loading.value = false
    unavailable.value = true
    error.value = '缺少百科 id'
    return
  }
  void load(id.value)
})

watch(id, (next) => {
  if (next) void load(next)
})
</script>

<template>
  <div class="detail-page cq-page cq-safe-bottom">
    <PageHeader title="地点详情" />

    <div v-if="loading" class="detail-loading">加载中…</div>

    <div v-else-if="unavailable" class="detail-unavailable">
      <div class="cq-empty">
        <div class="cq-empty__title">{{ error || '该地点已下架，暂时无法查看' }}</div>
        <div class="cq-empty__desc">可以返回首页继续逛逛</div>
        <button type="button" class="cq-btn-primary" @click="onBackHome">
          返回首页
        </button>
      </div>
    </div>

    <template v-else-if="detail">
      <div v-if="detail.hasImages" class="detail-gallery">
        <img
          class="detail-gallery__img"
          :src="detail.images[galleryIndex]"
          :alt="detail.name"
        />
        <template v-if="detail.images.length > 1">
          <button
            type="button"
            class="detail-gallery__nav detail-gallery__nav--prev"
            aria-label="上一张"
            @click="prevImage"
          >
            ‹
          </button>
          <button
            type="button"
            class="detail-gallery__nav detail-gallery__nav--next"
            aria-label="下一张"
            @click="nextImage"
          >
            ›
          </button>
          <div class="detail-gallery__dots">
            <span
              v-for="(_, i) in detail.images"
              :key="i"
              class="detail-gallery__dot"
              :class="{ 'detail-gallery__dot--on': i === galleryIndex }"
            />
          </div>
        </template>
      </div>

      <div class="detail-body">
        <div class="detail-title">{{ detail.name }}</div>
        <div class="detail-type">
          <span
            class="cq-type-dot"
            :style="{ background: detail.typeColor }"
          />
          <span>{{ detail.typeName }}</span>
        </div>

        <div v-if="detail.hasTags" class="detail-tags">
          <span v-for="tag in detail.tags" :key="tag" class="detail-tag">{{
            tag
          }}</span>
        </div>

        <div class="detail-intro">{{ detail.intro }}</div>

        <div
          v-if="
            detail.hasAddress ||
            detail.hasBusinessHours ||
            detail.hasAvgPrice ||
            detail.hasPhone
          "
          class="detail-meta"
        >
          <button
            v-if="detail.hasAddress"
            type="button"
            class="detail-meta__row"
            @click="onOpenMap"
          >
            <span class="detail-meta__label">地址</span>
            <span class="detail-meta__value detail-meta__link">{{
              detail.address
            }}</span>
          </button>
          <div v-if="detail.hasBusinessHours" class="detail-meta__row">
            <span class="detail-meta__label">营业时间</span>
            <span class="detail-meta__value">{{ detail.businessHours }}</span>
          </div>
          <div v-if="detail.hasAvgPrice" class="detail-meta__row">
            <span class="detail-meta__label">人均</span>
            <span class="detail-meta__value">{{ detail.avgPrice }}</span>
          </div>
          <button
            v-if="detail.hasPhone"
            type="button"
            class="detail-meta__row"
            @click="onCall"
          >
            <span class="detail-meta__label">电话</span>
            <span class="detail-meta__value detail-meta__link">{{
              detail.phone
            }}</span>
          </button>
        </div>
      </div>

      <div class="detail-bar cq-safe-bottom">
        <button
          type="button"
          class="detail-fav"
          :class="{ 'detail-fav--on': detail.isFavorited }"
          :disabled="favoriting"
          @click="onToggleFavorite"
        >
          {{ detail.isFavorited ? '★ 已收藏' : '☆ 收藏' }}
        </button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.detail-page {
  padding-bottom: calc(72px + env(safe-area-inset-bottom));
}

.detail-loading {
  padding: 40px;
  text-align: center;
  color: var(--color-ink-secondary);
}

.detail-gallery {
  position: relative;
  width: 100%;
  height: 220px;
  background: var(--color-fill);
}

.detail-gallery__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.detail-gallery__nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(26, 35, 50, 0.4);
  color: #fff;
  font-size: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.detail-gallery__nav--prev {
  left: 10px;
}

.detail-gallery__nav--next {
  right: 10px;
}

.detail-gallery__dots {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 10px;
  display: flex;
  justify-content: center;
  gap: 6px;
}

.detail-gallery__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
}

.detail-gallery__dot--on {
  background: #fff;
}

.detail-body {
  padding: 16px;
}

.detail-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--color-ink);
  line-height: 1.3;
}

.detail-type {
  margin-top: 8px;
  font-size: 14px;
  color: var(--color-ink-secondary);
  display: flex;
  align-items: center;
}

.detail-tags {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.detail-tag {
  font-size: 12px;
  line-height: 22px;
  padding: 0 10px;
  border-radius: var(--radius-pill);
  background: var(--color-fill);
  color: var(--color-ink-secondary);
}

.detail-intro {
  margin-top: 14px;
  font-size: 15px;
  line-height: 1.7;
  color: var(--color-ink);
  white-space: pre-wrap;
}

.detail-meta {
  margin-top: 18px;
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-card);
}

.detail-meta__row {
  display: flex;
  width: 100%;
  padding: 14px;
  border-bottom: 1px solid var(--color-line);
  text-align: left;
  background: transparent;
}

.detail-meta__row:last-child {
  border-bottom: none;
}

.detail-meta__label {
  width: 72px;
  flex-shrink: 0;
  color: var(--color-ink-muted);
  font-size: 14px;
}

.detail-meta__value {
  flex: 1;
  font-size: 14px;
  color: var(--color-ink);
  word-break: break-word;
}

.detail-meta__link {
  color: var(--color-primary);
}

.detail-bar {
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  bottom: 0;
  width: 100%;
  max-width: var(--page-max);
  padding: 10px 16px;
  background: var(--color-surface);
  border-top: 1px solid var(--color-line);
  z-index: 40;
}

.detail-fav {
  width: 100%;
  height: 44px;
  border-radius: var(--radius-pill);
  background: var(--color-primary-soft);
  color: var(--color-primary);
  font-size: 16px;
  font-weight: 600;
}

.detail-fav--on {
  background: var(--color-primary);
  color: #fff;
}
</style>
