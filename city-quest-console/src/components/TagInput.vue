<script setup lang="ts">
/**
 * Callers: EncyclopediaFormView. Multi free-text tags.
 * User: 开始阶段B 和 C, 完成产品闭环.
 */
import { ref } from 'vue'

const model = defineModel<string[]>({ default: () => [] })
const draft = ref('')

function addTag() {
  const value = draft.value.trim().replace(/,$/, '')
  if (!value) return
  if (!model.value.includes(value)) {
    model.value = [...model.value, value]
  }
  draft.value = ''
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' || e.key === ',') {
    e.preventDefault()
    addTag()
  } else if (e.key === 'Backspace' && !draft.value && model.value.length) {
    model.value = model.value.slice(0, -1)
  }
}

function removeAt(index: number) {
  model.value = model.value.filter((_, i) => i !== index)
}
</script>

<template>
  <div class="rounded-md border border-line bg-white px-2 py-2">
    <div class="flex flex-wrap gap-2">
      <span
        v-for="(tag, index) in model"
        :key="`${tag}-${index}`"
        class="inline-flex items-center gap-1 rounded-full bg-fill px-2 py-0.5 text-xs text-ink"
      >
        {{ tag }}
        <button type="button" class="text-ink-muted hover:text-danger" @click="removeAt(index)">
          ×
        </button>
      </span>
      <input
        v-model="draft"
        class="min-w-[8rem] flex-1 border-0 px-1 py-0.5 text-sm outline-none"
        placeholder="回车或逗号添加"
        @keydown="onKeydown"
        @blur="addTag"
      />
    </div>
  </div>
</template>
