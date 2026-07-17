<script setup lang="ts">
/**
 * Callers: EncyclopediaFormView. v-model = media keys; first = cover.
 * API: POST /admin/uploads → { key }; preview via fileUrl(key).
 */
import { ref } from 'vue'
import { ApiError, fileUrl, uploadImage } from '../api/client'
import { useAuthStore } from '../stores/auth'

const model = defineModel<string[]>({ default: () => [] })
const auth = useAuthStore()
const uploading = ref(false)
const error = ref('')

async function onPick(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file || !auth.token) return
  error.value = ''
  uploading.value = true
  try {
    const result = await uploadImage(auth.token, file)
    model.value = [...model.value, result.key]
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : '上传失败'
  } finally {
    uploading.value = false
  }
}

function removeAt(index: number) {
  model.value = model.value.filter((_, i) => i !== index)
}

function move(index: number, delta: number) {
  const next = index + delta
  if (next < 0 || next >= model.value.length) return
  const copy = [...model.value]
  const [item] = copy.splice(index, 1)
  copy.splice(next, 0, item!)
  model.value = copy
}

function previewAt(index: number): string {
  return fileUrl(model.value[index])
}
</script>

<template>
  <div>
    <div class="flex flex-wrap gap-3">
      <div
        v-for="(key, index) in model"
        :key="key"
        class="relative w-28 rounded-md border border-line bg-fill p-1"
      >
        <div class="absolute left-1 top-1 rounded bg-primary px-1 text-[10px] text-white">
          {{ index === 0 ? '封面' : index + 1 }}
        </div>
        <img
          v-if="previewAt(index)"
          :src="previewAt(index)"
          alt=""
          class="h-20 w-full rounded object-cover"
        />
        <div
          v-else
          class="flex h-20 items-center justify-center break-all p-1 text-[10px] text-ink-muted"
        >
          {{ key }}
        </div>
        <div class="mt-1 flex justify-between text-[10px]">
          <button type="button" class="text-primary" @click="move(index, -1)">左移</button>
          <button type="button" class="text-primary" @click="move(index, 1)">右移</button>
          <button type="button" class="text-danger" @click="removeAt(index)">删除</button>
        </div>
      </div>
      <label
        class="flex h-28 w-28 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-line bg-surface text-sm text-ink-secondary hover:border-primary"
      >
        <span>{{ uploading ? '上传中…' : '+ 上传' }}</span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          class="hidden"
          :disabled="uploading"
          @change="onPick"
        />
      </label>
    </div>
    <p v-if="error" class="mt-2 text-sm text-danger">{{ error }}</p>
    <p class="mt-2 text-xs text-ink-muted">第一张为封面；单张 ≤ 5MB，jpeg/png/webp</p>
  </div>
</template>
