/**
 * Callers: router, views. localStorage city_quest_admin_token.
 * User: 开始阶段B 和 C, 完成产品闭环.
 */
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { adminLogin } from '../api/client'

const TOKEN_KEY = 'city_quest_admin_token'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem(TOKEN_KEY))
  const isAuthenticated = computed(() => Boolean(token.value))

  function setToken(value: string) {
    token.value = value
    localStorage.setItem(TOKEN_KEY, value)
  }

  function logout() {
    token.value = null
    localStorage.removeItem(TOKEN_KEY)
  }

  async function login(username: string, password: string) {
    const result = await adminLogin(username, password)
    setToken(result.token)
  }

  return { token, isAuthenticated, login, logout, setToken }
})
