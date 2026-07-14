import { describe, expect, it } from 'vitest'
import { toMapMarkers } from '../miniprogram/features/encyclopedia/domain/rules/markers'
import { viewportFromMarkers } from '../miniprogram/core/map/viewport'

describe('toMapMarkers + viewport', () => {
  it('maps list items to marker vms', () => {
    const markers = toMapMarkers(
      [
        {
          id: '1',
          name: '店',
          typeKey: 'food',
          lng: 100.1,
          lat: 25.6,
          intro: 'hi',
        },
      ],
      '1',
    )
    expect(markers[0]).toMatchObject({
      id: '1',
      styleKey: 'food',
      selected: true,
      lng: 100.1,
      lat: 25.6,
    })
  })

  it('empty markers use default center viewport', () => {
    const vp = viewportFromMarkers([])
    expect(vp.center).toBeDefined()
    expect(vp.scale).toBeDefined()
  })

  it('non-empty uses includePoints', () => {
    const markers = toMapMarkers([
      {
        id: '1',
        name: 'A',
        typeKey: 'scenic',
        lng: 1,
        lat: 2,
        intro: '',
      },
    ])
    const vp = viewportFromMarkers(markers)
    expect(vp.includePoints).toEqual([{ lng: 1, lat: 2 }])
  })
})
