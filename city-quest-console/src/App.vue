<script setup lang="ts">
/** Callers: main. User: 开始阶段B 和 C, 完成产品闭环. */
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const showChrome = computed(() => route.name !== 'login')

function onLogout() {
  auth.logout()
  void router.push({ name: 'login' })
}
</script>

<template>
  <div class="min-h-screen bg-paper text-ink">
    <header
      v-if="showChrome"
      class="border-b border-line bg-surface px-6 py-3 flex items-center justify-between"
    >
      <div class="font-semibold text-primary">城市探秘 · 运营</div>
      <button type="button" class="text-sm text-primary hover:underline" @click="onLogout">
        退出
      </button>
    </header>
    <main :class="showChrome ? 'p-6' : ''">
      <RouterView />
    </main>
  </div>
</template>
