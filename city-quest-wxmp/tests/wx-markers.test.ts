/**
 * Callers: vitest. Tests pure presentation helper toWxMapMarkers.
 * Existing test rewritten for injected icon paths (was static PNG paths).
 * Schema: MapMarkerVm → WxMapMarker.
 * User: 把现在的微信小程序微信地图的 marker 用svg替代或直接绘制...
 */
import { describe, expect, it } from 'vitest'
import {
  collectMarkerIconRequests,
  toWxMapMarkers,
} from '../miniprogram/features/encyclopedia/presentation/wx-markers'
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

  const colorOf = (styleKey: string) =>
    styleKey === 'food' ? '#F97316' : '#2B4C7E'

  const iconPathOf = (color: string, selected: boolean) =>
    `cache://${color.toLowerCase()}|${selected ? '1' : '0'}`

  it('maps domain markers to wx markers with injected icons', () => {
    const wx = toWxMapMarkers(markers, null, colorOf, iconPathOf)
    expect(wx).toHaveLength(2)
    expect(wx[0]).toMatchObject({
      id: 0,
      longitude: 100.1,
      latitude: 25.6,
      encyclopediaId: 'a',
      width: 24,
      height: 24,
      iconPath: 'cache://#f97316|0',
    })
    expect(wx[1].iconPath).toBe('cache://#2b4c7e|0')
  })

  it('uses selected icon size when selectedId matches', () => {
    const wx = toWxMapMarkers(markers, 'a', colorOf, iconPathOf)
    expect(wx[0].iconPath).toBe('cache://#f97316|1')
    expect(wx[0].width).toBe(32)
    expect(wx[1].width).toBe(24)
  })
})

describe('collectMarkerIconRequests', () => {
  it('requests both selected states per unique color', () => {
    const markers: MapMarkerVm[] = [
      { id: '1', lng: 1, lat: 2, styleKey: 'food' },
      { id: '2', lng: 3, lat: 4, styleKey: 'food' },
      { id: '3', lng: 5, lat: 6, styleKey: 'scenic' },
    ]
    const colorOf = (k: string) => (k === 'food' ? '#F97316' : '#22C55E')
    const req = collectMarkerIconRequests(markers, colorOf)
    expect(req).toHaveLength(4)
    expect(req).toEqual(
      expect.arrayContaining([
        { color: '#F97316', selected: false },
        { color: '#F97316', selected: true },
        { color: '#22C55E', selected: false },
        { color: '#22C55E', selected: true },
      ]),
    )
  })
})
