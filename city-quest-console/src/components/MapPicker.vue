<script setup lang="ts">
/**
 * Callers: EncyclopediaFormView. OSM click/drag picker; stores GCJ-02.
 * User: 管理控制台经纬度支持地图选点.
 */
import L from 'leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import 'leaflet/dist/leaflet.css'
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { formatCoord, gcj02ToWgs84, parseLngLatText, wgs84ToGcj02 } from '../utils/coord'

// Leaflet Default icon still prefixes imagePath onto iconUrl. In Vite that yields a broken
// URL, so drop the override and point options at bundled assets.
// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-dynamic-delete
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

const lng = defineModel<string>('lng', { required: true })
const lat = defineModel<string>('lat', { required: true })

const OSM_TILE_URL = 'https://tile.openstreetmap.de/{z}/{x}/{y}.png'
const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
const DEFAULT_ZOOM = 14
const INPUT_SYNC_DEBOUNCE_MS = 300
const DALI_GCJ = { lng: 100.19, lat: 25.69 }

const mapEl = ref<HTMLElement | null>(null)
let map: L.Map | null = null
let marker: L.Marker | null = null
let applyingFromMap = false
let inputSyncTimer: ReturnType<typeof setTimeout> | null = null

function parseGcj(): { lng: number; lat: number } | null {
  return parseLngLatText(lng.value, lat.value)
}

function gcjToDisplayLatLng(gcjLng: number, gcjLat: number): L.LatLng {
  const wgs = gcj02ToWgs84(gcjLng, gcjLat)
  return L.latLng(wgs.lat, wgs.lng)
}

function setFormFromWgs(wgsLng: number, wgsLat: number) {
  const gcj = wgs84ToGcj02(wgsLng, wgsLat)
  applyingFromMap = true
  lng.value = formatCoord(gcj.lng)
  lat.value = formatCoord(gcj.lat)
  // Watch runs after this tick; keep the flag until then to avoid re-pan loops.
  void nextTick(() => {
    applyingFromMap = false
  })
}

function ensureMarker(display: L.LatLng) {
  if (!map) return
  if (!marker) {
    marker = L.marker(display, { draggable: true }).addTo(map)
    marker.on('dragend', () => {
      if (!marker) return
      const pos = marker.getLatLng()
      setFormFromWgs(pos.lng, pos.lat)
    })
    return
  }
  marker.setLatLng(display)
}

function syncMarkerFromForm(shouldPan: boolean) {
  if (!map || applyingFromMap) return
  const gcj = parseGcj()
  if (!gcj) return
  const display = gcjToDisplayLatLng(gcj.lng, gcj.lat)
  ensureMarker(display)
  if (shouldPan) {
    map.setView(display, map.getZoom() ?? DEFAULT_ZOOM)
  }
}

function scheduleSyncFromInput() {
  if (inputSyncTimer) clearTimeout(inputSyncTimer)
  inputSyncTimer = setTimeout(() => {
    inputSyncTimer = null
    syncMarkerFromForm(true)
  }, INPUT_SYNC_DEBOUNCE_MS)
}

onMounted(() => {
  if (!mapEl.value) return

  const gcj = parseGcj() ?? DALI_GCJ
  const center = gcjToDisplayLatLng(gcj.lng, gcj.lat)

  map = L.map(mapEl.value, {
    center,
    zoom: DEFAULT_ZOOM,
    attributionControl: true,
  })

  L.tileLayer(OSM_TILE_URL, {
    attribution: OSM_ATTRIBUTION,
    maxZoom: 19,
  }).addTo(map)

  ensureMarker(center)

  map.on('click', (e: L.LeafletMouseEvent) => {
    ensureMarker(e.latlng)
    setFormFromWgs(e.latlng.lng, e.latlng.lat)
  })

  // Leaflet needs a reflow after being mounted in a flex/grid form.
  requestAnimationFrame(() => {
    map?.invalidateSize()
  })
})

watch([lng, lat], () => {
  scheduleSyncFromInput()
})

onBeforeUnmount(() => {
  if (inputSyncTimer) {
    clearTimeout(inputSyncTimer)
    inputSyncTimer = null
  }
  if (map) {
    map.remove()
    map = null
  }
  marker = null
})
</script>

<template>
  <div class="space-y-2">
    <div
      ref="mapEl"
      class="h-72 w-full overflow-hidden rounded-md border border-line"
      role="application"
      aria-label="地图选点"
    />
    <p class="text-xs text-ink-muted">
      点击地图或拖动标记选点；底图为 OpenStreetMap（WGS84），保存坐标为
      <span class="font-medium">GCJ-02</span>（与微信地图一致），可在上方输入框微调。
    </p>
  </div>
</template>
