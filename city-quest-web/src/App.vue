<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppTabBar from './components/AppTabBar.vue'

const route = useRoute()
const showTab = computed(() => Boolean(route.meta.tab))
</script>

<template>
  <div class="app-shell">
    <router-view />
    <AppTabBar v-if="showTab" />
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100%;
  max-width: var(--page-max);
  margin: 0 auto;
  position: relative;
  background: var(--color-paper);
}
</style>
