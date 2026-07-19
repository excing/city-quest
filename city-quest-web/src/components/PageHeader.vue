<script setup lang="ts">
import { useRouter } from 'vue-router'

defineProps<{
  title: string
  showBack?: boolean
}>()

const router = useRouter()

function onBack() {
  if (window.history.length > 1) {
    router.back()
  } else {
    void router.push('/')
  }
}
</script>

<template>
  <header class="cq-page-header">
    <button
      v-if="showBack !== false"
      type="button"
      class="cq-page-header__back"
      aria-label="返回"
      @click="onBack"
    >
      ‹
    </button>
    <div class="cq-page-header__title">{{ title }}</div>
    <div class="cq-page-header__slot">
      <slot name="action" />
    </div>
  </header>
</template>

<style scoped>
.cq-page-header__slot {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
}
.cq-page-header {
  position: sticky;
}
</style>
