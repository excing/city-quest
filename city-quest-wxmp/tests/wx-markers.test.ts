/**
 * Callers: vitest. Tests pure presentation helper toWxMapMarkers.
 * Schema: MapMarkerVm → WxMapMarker. User: 实现阶段3.
 */
import { describe, expect, it } from 'vitest'
import { toWxMapMarkers } from '../miniprogram/features/encyclopedia/presentation/wx-markers'
import type { MapMarkerVm } from '../miniprogram/core/map/types'

describe('toWxMapMarkers', () => {
  const markers: MapMarkerVm[] = [
    {
      id: 'a',
      lng: 100.1,
      lat: 25.6,
      styleKey: 'food',
      title: '面馆',
    },
    {
      id: 'b',
      lng: 100.2,
      lat: 25.7,
      styleKey: 'unknown-type',
      title: '未知',
    },
  ]

  it('maps domain markers to wx markers with typed icons', () => {
    const wx = toWxMapMarkers(markers, null)
    expect(wx).toHaveLength(2)
    expect(wx[0]).toMatchObject({
      id: 0,
      longitude: 100.1,
      latitude: 25.6,
      encyclopediaId: 'a',
      width: 24,
      height: 24,
      iconPath: '/assets/markers/food.png',
    })
    expect(wx[1].iconPath).toBe('/assets/markers/default.png')
  })

  it('uses selected icon size when selectedId matches', () => {
    const wx = toWxMapMarkers(markers, 'a')
    expect(wx[0].iconPath).toBe('/assets/markers/food-selected.png')
    expect(wx[0].width).toBe(32)
    expect(wx[1].width).toBe(24)
  })
})
