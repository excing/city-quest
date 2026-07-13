/**
 * Callers: MapPicker. GCJ-02 ↔ WGS84 for China map offset.
 * User: 管理控制台经纬度支持地图选点.
 */

export interface LngLat {
  lng: number
  lat: number
}

const PI = Math.PI
const A = 6378245.0
const EE = 0.00669342162296594323

/** Rough China bounding box used by common offset algorithms. */
export function isOutOfChina(lng: number, lat: number): boolean {
  return lng < 72.004 || lng > 137.8347 || lat < 0.8293 || lat > 55.8271
}

export function isValidLngLat(lng: number, lat: number): boolean {
  return (
    Number.isFinite(lng) &&
    Number.isFinite(lat) &&
    lng >= -180 &&
    lng <= 180 &&
    lat >= -90 &&
    lat <= 90
  )
}

/** Parse user-entered lng/lat text; rejects empty, whitespace, and non-numeric junk. */
export function parseLngLatText(lngText: string, latText: string): LngLat | null {
  const lngRaw = lngText.trim()
  const latRaw = latText.trim()
  if (!lngRaw || !latRaw) return null
  // Allow optional sign and decimal; reject Number("") → 0 and partial junk.
  if (!/^-?\d+(\.\d+)?$/.test(lngRaw) || !/^-?\d+(\.\d+)?$/.test(latRaw)) return null
  const lng = Number(lngRaw)
  const lat = Number(latRaw)
  if (!isValidLngLat(lng, lat)) return null
  return { lng, lat }
}

function transformLat(lng: number, lat: number): number {
  let ret =
    -100.0 +
    2.0 * lng +
    3.0 * lat +
    0.2 * lat * lat +
    0.1 * lng * lat +
    0.2 * Math.sqrt(Math.abs(lng))
  ret += ((20.0 * Math.sin(6.0 * lng * PI) + 20.0 * Math.sin(2.0 * lng * PI)) * 2.0) / 3.0
  ret += ((20.0 * Math.sin(lat * PI) + 40.0 * Math.sin((lat / 3.0) * PI)) * 2.0) / 3.0
  ret += ((160.0 * Math.sin((lat / 12.0) * PI) + 320 * Math.sin((lat * PI) / 30.0)) * 2.0) / 3.0
  return ret
}

function transformLng(lng: number, lat: number): number {
  let ret =
    300.0 + lng + 2.0 * lat + 0.1 * lng * lng + 0.1 * lng * lat + 0.1 * Math.sqrt(Math.abs(lng))
  ret += ((20.0 * Math.sin(6.0 * lng * PI) + 20.0 * Math.sin(2.0 * lng * PI)) * 2.0) / 3.0
  ret += ((20.0 * Math.sin(lng * PI) + 40.0 * Math.sin((lng / 3.0) * PI)) * 2.0) / 3.0
  ret += ((150.0 * Math.sin((lng / 12.0) * PI) + 300.0 * Math.sin((lng / 30.0) * PI)) * 2.0) / 3.0
  return ret
}

function delta(lng: number, lat: number): LngLat {
  const dLat = transformLat(lng - 105.0, lat - 35.0)
  const dLng = transformLng(lng - 105.0, lat - 35.0)
  const radLat = (lat / 180.0) * PI
  let magic = Math.sin(radLat)
  magic = 1 - EE * magic * magic
  const sqrtMagic = Math.sqrt(magic)
  return {
    lat: (dLat * 180.0) / (((A * (1 - EE)) / (magic * sqrtMagic)) * PI),
    lng: (dLng * 180.0) / ((A / sqrtMagic) * Math.cos(radLat) * PI),
  }
}

/** OSM / GPS (WGS84) → WeChat / China map (GCJ-02). Outside China: identity. */
export function wgs84ToGcj02(lng: number, lat: number): LngLat {
  if (!isValidLngLat(lng, lat) || isOutOfChina(lng, lat)) {
    return { lng, lat }
  }
  const d = delta(lng, lat)
  return { lng: lng + d.lng, lat: lat + d.lat }
}

/** GCJ-02 → WGS84 (iterative). Outside China: identity. */
export function gcj02ToWgs84(lng: number, lat: number): LngLat {
  if (!isValidLngLat(lng, lat) || isOutOfChina(lng, lat)) {
    return { lng, lat }
  }
  let wgsLng = lng
  let wgsLat = lat
  for (let i = 0; i < 5; i += 1) {
    const converted = wgs84ToGcj02(wgsLng, wgsLat)
    wgsLng += lng - converted.lng
    wgsLat += lat - converted.lat
  }
  return { lng: wgsLng, lat: wgsLat }
}

export function formatCoord(value: number, digits = 6): string {
  if (!Number.isFinite(value)) return ''
  return value.toFixed(digits)
}
