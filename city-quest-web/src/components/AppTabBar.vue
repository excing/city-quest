<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const active = computed(() => (route.meta.tab as string) || '')

function go(path: string) {
  if (route.path === path) return
  void router.push(path)
}
</script>

<template>
  <nav class="tab-bar" aria-label="主导航">
    <button
      type="button"
      class="tab-item"
      :class="{ 'tab-item--active': active === 'map' }"
      @click="go('/')"
    >
      <span class="tab-item__icon" aria-hidden="true">⌂</span>
      <span class="tab-item__label">首页</span>
    </button>
    <button
      type="button"
      class="tab-item"
      :class="{ 'tab-item--active': active === 'mine' }"
      @click="go('/mine')"
    >
      <span class="tab-item__icon" aria-hidden="true">◎</span>
      <span class="tab-item__label">我的</span>
    </button>
  </nav>
</template>

<style scoped>
.tab-bar {
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  bottom: 0;
  width: 100%;
  max-width: var(--page-max);
  height: calc(var(--tab-height) + var(--safe-bottom));
  padding-bottom: var(--safe-bottom);
  display: flex;
  background: var(--color-surface);
  border-top: 1px solid var(--color-line);
  z-index: 50;
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  color: var(--color-ink-muted);
  height: var(--tab-height);
}

.tab-item--active {
  color: var(--color-primary);
}

.tab-item__icon {
  font-size: 18px;
  line-height: 1;
}

.tab-item__label {
  font-size: 11px;
}
</style>
