<script setup lang="ts">
import { computed, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    src?: string
    name?: string
    typeColor?: string
  }>(),
  {
    src: '',
    name: '',
    typeColor: '#2B4C7E',
  },
)

const failed = ref(false)

const monogram = computed(() => {
  const text = (props.name ?? '').trim()
  if (!text) return '探'
  return Array.from(text)[0] || '探'
})

const softBg = computed(() => {
  const raw = props.typeColor.trim()
  const m = /^#([0-9a-fA-F]{6})$/.exec(raw)
  if (!m) return 'rgba(43, 76, 126, 0.14)'
  const n = parseInt(m[1], 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  return `rgba(${r}, ${g}, ${b}, 0.14)`
})

const showImage = computed(() => Boolean(props.src) && !failed.value)
</script>

<template>
  <div class="list-cover" :style="{ background: softBg }">
    <img
      v-if="showImage"
      class="list-cover__img"
      :src="src"
      :alt="name || ''"
      @error="failed = true"
    />
    <span v-else class="list-cover__mono" :style="{ color: typeColor }">{{
      monogram
    }}</span>
  </div>
</template>

<style scoped>
.list-cover {
  width: 56px;
  height: 56px;
  border-radius: 10px;
  overflow: hidden;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.list-cover__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.list-cover__mono {
  font-size: 20px;
  font-weight: 600;
}
</style>
