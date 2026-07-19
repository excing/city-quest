<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getAppContext } from '../app-context'
import { fileUrl } from '../core/config/env'
import { messageFromUnknown } from '../core/error/messages'
import { AccountRoutes } from '../features/account/public'
import PageHeader from '../components/PageHeader.vue'
import { showToast } from '../shared/lib/toast'

const router = useRouter()
const nickname = ref('')
const phone = ref('')
const displayAvatarUrl = ref('')
const saving = ref(false)
const avatarFile = ref<File | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

function resolveAvatarDisplay(avatarKeyOrUrl: string | null | undefined): string {
  if (!avatarKeyOrUrl) return ''
  if (
    avatarKeyOrUrl.includes('://') ||
    avatarKeyOrUrl.startsWith('/') ||
    avatarKeyOrUrl.startsWith('blob:') ||
    avatarKeyOrUrl.startsWith('data:')
  ) {
    return avatarKeyOrUrl
  }
  return fileUrl(avatarKeyOrUrl)
}

async function bootstrap() {
  const ctx = getAppContext()
  if (!ctx.session.isLoggedIn()) {
    await ctx.ensureAuthenticated()
    if (!ctx.session.isLoggedIn()) {
      void router.replace(AccountRoutes.mine)
      return
    }
  }

  try {
    const user = await ctx.loadProfile()
    avatarFile.value = null
    nickname.value = user.nickname || ''
    phone.value = user.phone || ''
    displayAvatarUrl.value = resolveAvatarDisplay(user.avatarUrl)
  } catch (e) {
    const user = ctx.session.getUser()
    nickname.value = user?.nickname || ''
    phone.value = user?.phone || ''
    displayAvatarUrl.value = resolveAvatarDisplay(user?.avatarUrl)
    showToast(messageFromUnknown(e) || '加载资料失败')
  }
}

function pickAvatar() {
  fileInput.value?.click()
}

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  avatarFile.value = file
  displayAvatarUrl.value = URL.createObjectURL(file)
}

async function onSave() {
  if (saving.value) return
  saving.value = true
  try {
    await getAppContext().updateProfile({
      nickname: nickname.value,
      phone: phone.value,
      avatarFile: avatarFile.value,
    })
    avatarFile.value = null
    showToast('已保存')
    window.setTimeout(() => {
      router.back()
    }, 400)
  } catch (e) {
    showToast(messageFromUnknown(e) || '保存失败')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  void bootstrap()
})
</script>

<template>
  <div class="profile-page cq-page cq-safe-bottom">
    <PageHeader title="编辑资料" />

    <div class="profile-card cq-card">
      <div class="profile-avatar-row">
        <button type="button" class="profile-avatar-btn" @click="pickAvatar">
          <img
            v-if="displayAvatarUrl"
            class="profile-avatar"
            :src="displayAvatarUrl"
            alt=""
          />
          <div v-else class="profile-avatar profile-avatar--placeholder">探</div>
        </button>
        <div class="profile-avatar-hint">点击更换头像</div>
        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          class="profile-file"
          @change="onFileChange"
        />
      </div>

      <label class="profile-field">
        <span class="profile-label">昵称</span>
        <input
          v-model="nickname"
          class="profile-input"
          type="text"
          maxlength="64"
          placeholder="请输入昵称"
        />
      </label>

      <label class="profile-field">
        <span class="profile-label">手机号</span>
        <input
          v-model="phone"
          class="profile-input"
          type="tel"
          maxlength="11"
          placeholder="选填"
        />
      </label>
    </div>

    <button
      type="button"
      class="cq-btn-primary profile-save"
      :disabled="saving"
      @click="onSave"
    >
      {{ saving ? '保存中…' : '保存' }}
    </button>
  </div>
</template>

<style scoped>
.profile-card {
  margin: 8px 16px 0;
  padding: 20px 16px;
}

.profile-avatar-row {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
}

.profile-avatar-btn {
  border-radius: 50%;
}

.profile-avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  object-fit: cover;
  background: var(--color-fill);
}

.profile-avatar--placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary);
  font-size: 24px;
  font-weight: 600;
  background: var(--color-primary-soft);
}

.profile-avatar-hint {
  font-size: 13px;
  color: var(--color-ink-muted);
}

.profile-file {
  display: none;
}

.profile-field {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-top: 1px solid var(--color-line);
}

.profile-label {
  width: 56px;
  flex-shrink: 0;
  font-size: 15px;
  color: var(--color-ink-secondary);
}

.profile-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 15px;
  min-width: 0;
}

.profile-save {
  margin: 24px 16px 0;
  width: calc(100% - 32px);
}
</style>
