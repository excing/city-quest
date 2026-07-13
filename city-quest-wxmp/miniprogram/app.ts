/**
 * App entry. Stage A: no auto login.
 * Callers: WeChat runtime.
 * User: 阅读 @docs , 然后选择合适的agents或skills, 开始进行开发.
 */
App<IAppOption>({
  globalData: {},
  onLaunch() {
    // Stage A: no wx.login bootstrap; types/list loaded on map page.
  },
})
