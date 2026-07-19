<script setup lang="ts">
import { onMounted, onUnmounted, ref, shallowRef, watch } from 'vue'
import { useRouter } from 'vue-router'
import L from 'leaflet'
import { getAppContext } from '../app-context'
import {
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  OSM_TILE_ATTRIBUTION,
  OSM_TILE_URL,
} from '../core/config/constants'
import { messageFromUnknown } from '../core/error/messages'
import type { MapMarkerVm } from '../core/map/types'
import { viewportForPoint } from '../core/map/viewport'
import type { EncyclopediaListItem } from '../features/encyclopedia/public'
import {
  buildTypeMap,
  detailUrl,
  typeColorOf,
  typeNameOf,
} from '../features/encyclopedia/public'
import { createLoadSeq } from '../shared/lib/load-seq'

interface PreviewCard {
  id: string
  name: string
  intro: string
  typeName: string
  typeColor: string
  lng: number
  lat: number
}

const router = useRouter()
const loadSeq = createLoadSeq()

const mapEl = ref<HTMLElement | null>(null)
const map = shallowRef<L.Map | null>(null)
const markersLayer = shallowRef<L.LayerGroup | null>(null)

const loading = ref(true)
const error = ref('')
const empty = ref(false)
const selectedId = ref('')
const preview = ref<PreviewCard | null>(null)
const showUserLocation = ref(true)

let items: EncyclopediaListItem[] = []
let markersVm: MapMarkerVm[] = []
let typeMap: Record<string, { key: string; name: string; color: string }> = {}
let didFitViewport = false
let userLocationMarker: L.CircleMarker | null = null
const markerById = new Map<string, L.CircleMarker>()

function makeIconColor(styleKey: string, selected: boolean): string {
  const base = typeColorOf(styleKey, typeMap)
  return selected ? base : base
}

function createCircleMarker(vm: MapMarkerVm): L.CircleMarker {
  const selected = Boolean(vm.selected)
  const color = makeIconColor(vm.styleKey, selected)
  const marker = L.circleMarker([vm.lat, vm.lng], {
    radius: selected ? 11 : 8,
    color: selected ? '#1a2332' : '#ffffff',
    weight: selected ? 2.5 : 2,
    fillColor: color,
    fillOpacity: 0.95,
    opacity: 1,
  })
  marker.bindTooltip(vm.title || '', {
    direction: 'top',
    offset: [0, -8],
    opacity: 0.95,
    className: 'cq-map-tooltip',
  })
  marker.on('click', (e) => {
    L.DomEvent.stopPropagation(e)
    applySelection(vm.id)
  })
  return marker
}

function paintMarkers(vms: MapMarkerVm[]) {
  const layer = markersLayer.value
  if (!layer) return
  layer.clearLayers()
  markerById.clear()
  for (const vm of vms) {
    const m = createCircleMarker(vm)
    m.addTo(layer)
    markerById.set(vm.id, m)
  }
}

function applySelection(nextId: string | null) {
  selectedId.value = nextId || ''
  markersVm = markersVm.map((m) => ({
    ...m,
    selected: nextId ? m.id === nextId : false,
  }))
  paintMarkers(markersVm)
  preview.value = nextId ? buildPreview(nextId) : null
}

function buildPreview(id: string): PreviewCard | null {
  const item = items.find((x) => x.id === id)
  if (!item) return null
  return {
    id: item.id,
    name: item.name,
    intro: item.intro,
    typeName: typeNameOf(item.typeKey, typeMap),
    typeColor: typeColorOf(item.typeKey, typeMap),
    lng: item.lng,
    lat: item.lat,
  }
}

async function reload(opts?: { soft?: boolean; forceRefresh?: boolean }) {
  const soft = Boolean(opts?.soft)
  const forceRefresh = Boolean(opts?.forceRefresh)
  const seq = loadSeq.next()

  if (!soft) {
    loading.value = true
    error.value = ''
  }

  try {
    const result = await getAppContext().loadMapPoints({
      selectedId: selectedId.value || null,
      forceRefresh,
    })
    if (!loadSeq.isCurrent(seq)) return

    typeMap = buildTypeMap(result.types)
    items = result.items
    markersVm = result.markers
    getAppContext().setEncyclopediaTypes(result.types)

    loading.value = false
    error.value = ''
    empty.value = result.items.length === 0
    paintMarkers(markersVm)

    if (selectedId.value) {
      const p = buildPreview(selectedId.value)
      if (p) preview.value = p
      else {
        selectedId.value = ''
        preview.value = null
      }
    }

    const m = map.value
    if (m && !didFitViewport) {
      if (result.viewport.includePoints && result.viewport.includePoints.length > 0) {
        const bounds = L.latLngBounds(
          result.viewport.includePoints.map((p) => [p.lat, p.lng] as [number, number]),
        )
        m.fitBounds(bounds.pad(0.15), { maxZoom: 15, animate: false })
      } else if (result.viewport.center) {
        m.setView(
          [result.viewport.center.lat, result.viewport.center.lng],
          result.viewport.zoom ?? DEFAULT_MAP_ZOOM,
          { animate: false },
        )
      }
      didFitViewport = true
    }
  } catch (e) {
    if (!loadSeq.isCurrent(seq)) return
    if (soft && didFitViewport) {
      void messageFromUnknown(e)
      return
    }
    loading.value = false
    error.value = '点位加载失败，点击重试'
    empty.value = false
    paintMarkers([])
  }
}

function onMapBlankClick() {
  if (!selectedId.value && !preview.value) return
  applySelection(null)
}

function onOpenDetail() {
  const id = preview.value?.id
  if (!id) return
  void router.push(detailUrl(id))
}

function onLocateHere() {
  const p = preview.value
  const m = map.value
  if (!p || !m) return
  const viewport = viewportForPoint({ lng: p.lng, lat: p.lat })
  if (!viewport.center || viewport.zoom == null) return
  m.setView([viewport.center.lat, viewport.center.lng], viewport.zoom, {
    animate: true,
  })
}

function onRetry() {
  void reload({ soft: false, forceRefresh: true })
}

function tryShowUserLocation() {
  if (!showUserLocation.value || !map.value) return
  if (!navigator.geolocation) return
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const m = map.value
      if (!m) return
      const lat = pos.coords.latitude
      const lng = pos.coords.longitude
      if (userLocationMarker) {
        userLocationMarker.setLatLng([lat, lng])
      } else {
        userLocationMarker = L.circleMarker([lat, lng], {
          radius: 7,
          color: '#ffffff',
          weight: 2,
          fillColor: '#3B82F6',
          fillOpacity: 1,
        }).addTo(m)
        userLocationMarker.bindTooltip('我的位置', {
          direction: 'top',
          offset: [0, -6],
          className: 'cq-map-tooltip',
        })
      }
    },
    () => {
      // permission denied / unavailable — ignore
    },
    { enableHighAccuracy: false, timeout: 8000, maximumAge: 60_000 },
  )
}

onMounted(() => {
  if (!mapEl.value) return
  const m = L.map(mapEl.value, {
    zoomControl: false,
    attributionControl: true,
  }).setView(
    [DEFAULT_MAP_CENTER.lat, DEFAULT_MAP_CENTER.lng],
    DEFAULT_MAP_ZOOM,
  )

  L.tileLayer(OSM_TILE_URL, {
    attribution: OSM_TILE_ATTRIBUTION,
    maxZoom: 19,
  }).addTo(m)

  L.control.zoom({ position: 'bottomright' }).addTo(m)

  const layer = L.layerGroup().addTo(m)
  markersLayer.value = layer
  map.value = m

  m.on('click', onMapBlankClick)

  void reload({ soft: false })
  tryShowUserLocation()
})

onUnmounted(() => {
  map.value?.remove()
  map.value = null
  markersLayer.value = null
  markerById.clear()
  userLocationMarker = null
})

// Soft refresh when returning to tab (keep viewport)
watch(
  () => map.value,
  (m) => {
    if (m) {
      // ensure size after layout
      window.setTimeout(() => m.invalidateSize(), 50)
    }
  },
)
</script>

<template>
  <div class="map-page cq-page--with-tab">
    <div ref="mapEl" class="map" />

    <div v-if="loading" class="map-banner map-banner--loading">加载点位…</div>
    <button
      v-else-if="error"
      type="button"
      class="map-banner map-banner--error"
      @click="onRetry"
    >
      {{ error }}
    </button>

    <div v-else-if="empty" class="map-empty">
      <div class="map-empty__title">暂时还没有点位</div>
      <button type="button" class="cq-btn-ghost" @click="onRetry">刷新</button>
    </div>

    <div
      v-if="preview"
      class="preview-dock cq-safe-bottom"
      role="button"
      tabindex="0"
      @click="onOpenDetail"
      @keydown.enter="onOpenDetail"
    >
      <div class="preview-card">
        <div
          class="preview-card__bar"
          :style="{ background: preview.typeColor }"
        />
        <div class="preview-card__body">
          <div class="preview-card__head">
            <div class="preview-card__name">{{ preview.name }}</div>
            <button
              type="button"
              class="preview-card__go"
              @click.stop="onLocateHere"
            >
              <span class="preview-card__go-label">定位到这里</span>
              <span class="preview-card__go-chevron">›</span>
            </button>
          </div>
          <div class="preview-card__type">
            <span
              class="cq-type-dot"
              :style="{ background: preview.typeColor }"
            />
            <span class="preview-card__type-name">{{ preview.typeName }}</span>
          </div>
          <div v-if="preview.intro" class="preview-card__intro">
            {{ preview.intro }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.map-page {
  position: relative;
  width: 100%;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  background: var(--color-fill);
}

.map {
  width: 100%;
  height: 100%;
  z-index: 0;
}

.map-banner {
  position: absolute;
  top: 12px;
  left: 16px;
  right: 16px;
  z-index: 10;
  padding: 10px 14px;
  border-radius: var(--radius-md);
  font-size: 14px;
  text-align: center;
  box-shadow: var(--shadow-card);
  border: 1px solid rgba(255, 255, 255, 0.6);
}

.map-banner--loading {
  background: var(--color-map-chrome);
  color: var(--color-ink-secondary);
}

.map-banner--error {
  background: var(--color-danger-soft);
  color: var(--color-danger);
  border-color: transparent;
  width: calc(100% - 32px);
  cursor: pointer;
}

.map-empty {
  position: absolute;
  left: 50%;
  top: 42%;
  transform: translate(-50%, -50%);
  z-index: 10;
  width: 70%;
  padding: 20px 16px;
  background: var(--color-map-chrome);
  border-radius: var(--radius-lg);
  text-align: center;
  box-shadow: var(--shadow-card);
  border: 1px solid rgba(255, 255, 255, 0.65);
}

.map-empty__title {
  font-size: 15px;
  color: var(--color-ink);
  margin-bottom: 12px;
}

.preview-dock {
  position: absolute;
  left: 0;
  right: 0;
  bottom: calc(var(--tab-height) + 4px);
  z-index: 20;
  padding-left: 16px;
  padding-right: 16px;
  padding-top: 4px;
  cursor: pointer;
}

.preview-card {
  display: flex;
  align-items: stretch;
  min-height: 76px;
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sheet);
  border: 1px solid var(--color-line);
  overflow: hidden;
}

.preview-card:active {
  transform: scale(0.985);
  opacity: 0.96;
}

.preview-card__bar {
  width: 5px;
  flex-shrink: 0;
}

.preview-card__body {
  flex: 1;
  min-width: 0;
  padding: 14px 14px 14px 12px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
}

.preview-card__head {
  display: flex;
  align-items: center;
  gap: 8px;
}

.preview-card__name {
  flex: 1;
  min-width: 0;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.3;
  color: var(--color-ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preview-card__go {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 1px;
  padding: 4px 2px 4px 8px;
  border-radius: var(--radius-pill);
  background: var(--color-primary-soft);
}

.preview-card__go-label {
  font-size: 12px;
  line-height: 1;
  color: var(--color-primary);
  font-weight: 500;
}

.preview-card__go-chevron {
  font-size: 16px;
  line-height: 1;
  color: var(--color-primary);
}

.preview-card__type {
  display: flex;
  align-items: center;
}

.preview-card__type-name {
  font-size: 12px;
  color: var(--color-ink-secondary);
}

.preview-card__intro {
  font-size: 13px;
  line-height: 1.45;
  color: var(--color-ink-secondary);
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  word-break: break-word;
}

:deep(.cq-map-tooltip) {
  background: var(--color-surface);
  border: 1px solid var(--color-line);
  border-radius: 6px;
  box-shadow: var(--shadow-card);
  color: var(--color-ink);
  font-size: 12px;
  padding: 4px 8px;
}

:deep(.cq-map-tooltip::before) {
  border-top-color: var(--color-surface);
}

:deep(.leaflet-control-zoom) {
  border: none !important;
  box-shadow: var(--shadow-card);
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: calc(var(--tab-height) + 80px) !important;
}

:deep(.leaflet-control-zoom a) {
  width: 34px !important;
  height: 34px !important;
  line-height: 34px !important;
  color: var(--color-ink) !important;
}
</style>
