/**
 * Canvas-generated map marker icons with in-memory path cache.
 * Callers: pages/map/map.ts; tests with mock drawAndExport.
 * Writes under USER_DATA_PATH/cq-markers/.
 */

import {
  markerIconCacheKey,
  markerIconStyle,
  type MarkerIconStyle,
} from './marker-icon-style'

/** Package fallback when canvas export fails. */
export const FALLBACK_MARKER_ICON = '/assets/markers/default.png'

export type DrawMarkerPng = (style: MarkerIconStyle) => Promise<string>

export interface MarkerIconService {
  ensure(color: string, selected: boolean): Promise<string>
  ensureAll(
    entries: ReadonlyArray<{ color: string; selected: boolean }>,
  ): Promise<void>
  /** Sync cache lookup only (null if not yet ensured). */
  pathOf(color: string, selected: boolean): string | null
}

function markerDir(): string {
  return `${wx.env.USER_DATA_PATH}/cq-markers`
}

/** "#f97316|0" → "f97316_0.png" */
export function markerIconFileName(cacheKey: string): string {
  return `${cacheKey.replace(/^#/, '').replace(/\|/g, '_')}.png`
}

export function markerIconUserPath(color: string, selected: boolean): string {
  const key = markerIconCacheKey(color, selected)
  return `${markerDir()}/${markerIconFileName(key)}`
}

function ensureMarkerDir(fs: WechatMiniprogram.FileSystemManager, dir: string): void {
  try {
    fs.accessSync(dir)
  } catch {
    fs.mkdirSync(dir, true)
  }
}

function tryExistingPath(path: string): string | null {
  try {
    const fs = wx.getFileSystemManager()
    fs.accessSync(path)
    return path
  } catch {
    return null
  }
}

/**
 * Default drawer: reuse disk file if present; else offscreen 2d → USER_DATA_PATH PNG.
 */
export async function drawMarkerIconToUserPath(
  style: MarkerIconStyle,
): Promise<string> {
  const dest = markerIconUserPath(style.color, style.selected)
  const existing = tryExistingPath(dest)
  if (existing) return existing

  const canvasSize = style.canvasSize
  // Runtime supports options object; typings in project may be older.
  const canvas = (
    wx.createOffscreenCanvas as unknown as (opt: {
      type: string
      width: number
      height: number
    }) => WechatMiniprogram.OffscreenCanvas
  )({
    type: '2d',
    width: canvasSize,
    height: canvasSize,
  })

  // Offscreen 2d context is untyped in project typings (returns any).
  const ctx = canvas.getContext('2d') as {
    clearRect(x: number, y: number, w: number, h: number): void
    beginPath(): void
    arc(
      x: number,
      y: number,
      r: number,
      start: number,
      end: number,
    ): void
    closePath(): void
    fill(): void
    stroke(): void
    fillStyle: string
    strokeStyle: string
    lineWidth: number
  } | null
  if (!ctx) {
    throw new Error('marker icon: 2d context unavailable')
  }

  const cx = canvasSize / 2
  const cy = canvasSize / 2
  ctx.clearRect(0, 0, canvasSize, canvasSize)
  ctx.beginPath()
  ctx.arc(cx, cy, style.radius, 0, Math.PI * 2)
  ctx.closePath()
  ctx.fillStyle = style.color
  ctx.fill()
  ctx.lineWidth = style.strokeWidth
  ctx.strokeStyle = '#ffffff'
  ctx.stroke()

  const tempPath = await new Promise<string>((resolve, reject) => {
    wx.canvasToTempFilePath({
      canvas: canvas as unknown as WechatMiniprogram.IAnyObject,
      fileType: 'png',
      quality: 1,
      success: (res) => resolve(res.tempFilePath),
      fail: (err) =>
        reject(new Error(err.errMsg || 'canvasToTempFilePath failed')),
    })
  })

  const fs = wx.getFileSystemManager()
  ensureMarkerDir(fs, markerDir())
  try {
    fs.unlinkSync(dest)
  } catch {
    // absent is fine
  }
  return fs.saveFileSync(tempPath, dest)
}

export function createMarkerIconService(deps?: {
  drawAndExport?: DrawMarkerPng
  fallbackIconPath?: string
}): MarkerIconService {
  const drawAndExport = deps?.drawAndExport ?? drawMarkerIconToUserPath
  const fallbackIconPath = deps?.fallbackIconPath ?? FALLBACK_MARKER_ICON
  const paths = new Map<string, string>()
  const inflight = new Map<string, Promise<string>>()

  async function ensure(color: string, selected: boolean): Promise<string> {
    const key = markerIconCacheKey(color, selected)
    const cached = paths.get(key)
    if (cached) return cached

    const pending = inflight.get(key)
    if (pending) return pending

    const job = (async () => {
      try {
        const style = markerIconStyle(color, selected)
        const path = await drawAndExport(style)
        paths.set(key, path)
        return path
      } catch {
        // Do not cache fallback — transient canvas/FS errors should retry next ensure.
        return fallbackIconPath
      } finally {
        inflight.delete(key)
      }
    })()

    inflight.set(key, job)
    return job
  }

  return {
    ensure,
    async ensureAll(entries) {
      await Promise.all(entries.map((e) => ensure(e.color, e.selected)))
    },
    pathOf(color, selected) {
      return paths.get(markerIconCacheKey(color, selected)) ?? null
    },
  }
}
