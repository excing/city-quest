/**
 * Settings page — map preferences and about.
 * Callers: WeChat router from mine goSettings (AccountRoutes.settings).
 */

import { getAppContext } from '../../../app-context'
import { navigateTo } from '../../../core/navigation/nav'
import { AccountRoutes } from '../../../features/account/routes'

Page({
  data: {
    mapShowPoi: false,
  },

  onShow() {
    this.refreshPreferences()
  },

  refreshPreferences() {
    this.setData({
      mapShowPoi: getAppContext().getMapShowPoi(),
    })
  },

  onMapShowPoiChange(e: { detail: { value: boolean } }) {
    const mapShowPoi = Boolean(e.detail.value)
    getAppContext().setMapShowPoi(mapShowPoi)
    this.setData({ mapShowPoi })
  },

  goAbout() {
    navigateTo(AccountRoutes.about)
  },
})
