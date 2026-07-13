<script setup lang="ts">
/**
 * Callers: router /login. API: POST /admin/login.
 * User: 开始阶段B 和 C, 完成产品闭环.
 */
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ApiError } from '../api/client'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()
const username = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function onSubmit() {
  error.value = ''
  loading.value = true
  try {
    await auth.login(username.value.trim(), password.value)
    const redirect =
      typeof route.query.redirect === 'string' ? route.query.redirect : '/encyclopedias'
    await router.replace(redirect)
  } catch (e) {
    error.value = e instanceof ApiError ? '账号或密码错误' : '登录失败，请重试'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center px-4">
    <form
      class="w-full max-w-sm rounded-xl border border-line bg-surface p-6 shadow-sm"
      @submit.prevent="onSubmit"
    >
      <h1 class="text-xl font-semibold text-ink">城市探秘 · 运营登录</h1>
      <p class="mt-1 text-sm text-ink-secondary">使用配置的管理员账号登录</p>
      <div
        v-if="error"
        class="mt-4 rounded-md bg-danger-soft px-3 py-2 text-sm text-danger"
        role="alert"
      >
        {{ error }}
      </div>
      <label class="mt-5 block text-sm font-medium" for="username">用户名</label>
      <input
        id="username"
        v-model="username"
        class="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm"
        autocomplete="username"
        required
      />
      <label class="mt-4 block text-sm font-medium" for="password">密码</label>
      <input
        id="password"
        v-model="password"
        type="password"
        class="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm"
        autocomplete="current-password"
        required
      />
      <button
        type="submit"
        class="mt-6 w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-pressed disabled:opacity-60"
        :disabled="loading"
      >
        {{ loading ? '登录中…' : '登录' }}
      </button>
    </form>
  </div>
</template>
