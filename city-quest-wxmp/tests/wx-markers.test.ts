/**
 * Callers: vitest. Tests pure presentation helpers for wx map markers.
 */
import { describe, expect, it } from 'vitest'
import {
  collectMarkerIconRequests,
  createMarkerIdMap,
  patchMarkersSelection,
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
      width: 18,
      height: 18,
      anchor: { x: 0.5, y: 0.5 },
      iconPath: 'cache://#f97316|0',
      label: {
        content: '面馆',
        fontSize: 14,
        color: '#1a2332',
        textAlign: 'right',
      },
    })
    expect(wx[1].iconPath).toBe('cache://#2b4c7e|0')
    expect(wx[1].label?.content).toBe('未知')
  })

  it('uses selected icon size when selectedId matches', () => {
    const wx = toWxMapMarkers(markers, 'a', colorOf, iconPathOf)
    expect(wx[0].iconPath).toBe('cache://#f97316|1')
    expect(wx[0].width).toBe(24)
    expect(wx[0].label?.fontSize).toBe(18)
    expect(wx[0].label?.color).toBe('#1a2332')
    expect(wx[0].label?.bgColor).toBe('#00000000')
    expect(wx[1].width).toBe(18)
  })

  it('omits label when title is missing', () => {
    const bare: MapMarkerVm[] = [
      { id: 'z', lng: 1, lat: 2, styleKey: 'food' },
    ]
    const wx = toWxMapMarkers(bare, null, colorOf, iconPathOf)
    expect(wx[0].label).toBeUndefined()
  })

  it('uses stable idOf when provided', () => {
    const ids = createMarkerIdMap()
    const wx = toWxMapMarkers(markers, null, colorOf, iconPathOf, ids.idOf)
    expect(wx[0].id).toBe(1)
    expect(wx[1].id).toBe(2)
    // Reorder: same encyclopediaId keeps same numeric id
    const reordered = toWxMapMarkers(
      [markers[1], markers[0]],
      null,
      colorOf,
      iconPathOf,
      ids.idOf,
    )
    expect(reordered[0].encyclopediaId).toBe('b')
    expect(reordered[0].id).toBe(2)
    expect(reordered[1].id).toBe(1)
  })
})

describe('createMarkerIdMap', () => {
  it('assigns monotonic unique ids and clear resets', () => {
    const map = createMarkerIdMap()
    expect(map.idOf('x')).toBe(1)
    expect(map.idOf('y')).toBe(2)
    expect(map.idOf('x')).toBe(1)
    map.clear()
    expect(map.idOf('x')).toBe(1)
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

describe('patchMarkersSelection', () => {
  const vms: MapMarkerVm[] = [
    { id: 'a', lng: 100, lat: 25, styleKey: 'food', title: '面馆' },
    { id: 'b', lng: 101, lat: 26, styleKey: 'scenic', title: '洱海' },
    { id: 'c', lng: 102, lat: 27, styleKey: 'food', title: '小吃' },
  ]
  const colorOf = (k: string) => (k === 'food' ? '#F97316' : '#22C55E')
  const iconPathOf = (color: string, selected: boolean) =>
    `${color}|${selected ? 1 : 0}`
  const ids = createMarkerIdMap()
  const base = toWxMapMarkers(vms, null, colorOf, iconPathOf, ids.idOf)
  const vmById = Object.fromEntries(vms.map((m) => [m.id, m]))

  it('patches only prev and next indices when selection moves', () => {
    const withA = patchMarkersSelection({
      markers: base,
      prevSelectedId: null,
      nextSelectedId: 'a',
      vmById,
      colorOf,
      iconPathOf,
    })
    expect(Object.keys(withA.setDataPatch)).toEqual(['markers[0]'])
    expect(withA.markers[0].width).toBe(24)
    expect(withA.markers[0].iconPath).toBe('#F97316|1')
    expect(withA.markers[0].label?.color).toBe('#1a2332')
    expect(withA.markers[0].label?.fontSize).toBe(18)
    expect(withA.markers[0].label?.bgColor).toBe('#00000000')
    expect(withA.markers[1].width).toBe(18)

    const toB = patchMarkersSelection({
      markers: withA.markers,
      prevSelectedId: 'a',
      nextSelectedId: 'b',
      vmById,
      colorOf,
      iconPathOf,
    })
    expect(Object.keys(toB.setDataPatch).sort()).toEqual([
      'markers[0]',
      'markers[1]',
    ])
    expect(toB.markers[0].width).toBe(18)
    expect(toB.markers[0].iconPath).toBe('#F97316|0')
    expect(toB.markers[1].width).toBe(24)
    expect(toB.markers[1].iconPath).toBe('#22C55E|1')
    // untouched
    expect(toB.setDataPatch['markers[2]']).toBeUndefined()
    expect(toB.markers[2].width).toBe(18)
  })

  it('returns empty patch when selection unchanged', () => {
    const r = patchMarkersSelection({
      markers: base,
      prevSelectedId: 'a',
      nextSelectedId: 'a',
      vmById,
      colorOf,
      iconPathOf,
    })
    expect(r.setDataPatch).toEqual({})
  })

  it('clears selection with single patch on prev', () => {
    const selected = patchMarkersSelection({
      markers: base,
      prevSelectedId: null,
      nextSelectedId: 'c',
      vmById,
      colorOf,
      iconPathOf,
    })
    const cleared = patchMarkersSelection({
      markers: selected.markers,
      prevSelectedId: 'c',
      nextSelectedId: null,
      vmById,
      colorOf,
      iconPathOf,
    })
    expect(Object.keys(cleared.setDataPatch)).toEqual(['markers[2]'])
    expect(cleared.markers[2].width).toBe(18)
  })
})
