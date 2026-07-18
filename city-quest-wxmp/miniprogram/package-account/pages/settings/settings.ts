/**
 * Settings page — shell entries such as about.
 * Callers: WeChat router from mine goSettings (AccountRoutes.settings).
 */

import { navigateTo } from '../../../core/navigation/nav'
import { AccountRoutes } from '../../../features/account/routes'

Page({
  goAbout() {
    navigateTo(AccountRoutes.about)
  },
})
