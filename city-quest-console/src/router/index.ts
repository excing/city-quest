/**
 * Callers: main.ts. Admin route guard.
 * User: 开始阶段B 和 C, 完成产品闭环.
 */
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import LoginView from '../views/LoginView.vue'
import EncyclopediaListView from '../views/EncyclopediaListView.vue'
import EncyclopediaFormView from '../views/EncyclopediaFormView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: LoginView, meta: { public: true } },
    { path: '/', redirect: '/encyclopedias' },
    { path: '/encyclopedias', name: 'encyclopedias', component: EncyclopediaListView },
    { path: '/encyclopedias/new', name: 'encyclopedia-new', component: EncyclopediaFormView },
    {
      path: '/encyclopedias/:id',
      name: 'encyclopedia-edit',
      component: EncyclopediaFormView,
      props: true,
    },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.public) {
    if (to.name === 'login' && auth.isAuthenticated) return { name: 'encyclopedias' }
    return true
  }
  if (!auth.isAuthenticated) return { name: 'login', query: { redirect: to.fullPath } }
  return true
})

export default router
