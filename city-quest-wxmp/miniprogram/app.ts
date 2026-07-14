/**
 * App entry — composition root hydrate only.
 * Callers: WeChat runtime.
 */

import { initAppContext } from './app-context'

App<IAppOption>({
  globalData: {},
  onLaunch() {
    initAppContext()
  },
})
