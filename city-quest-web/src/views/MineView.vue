<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getAppContext } from '../app-context'
import { fileUrl } from '../core/config/env'
import { AccountRoutes } from '../features/account/public'
import { EncyclopediaRoutes } from '../features/encyclopedia/public'
import { confirmDialog } from '../shared/lib/toast'

const router = useRouter()
const loggedIn = ref(false)
const nickname = ref('')
const avatarUrl = ref('')

function resolveAvatarDisplay(avatarKeyOrUrl: string | null | undefined): string {
  if (!avatarKeyOrUrl) return ''
  if (
    avatarKeyOrUrl.startsWith('http://') ||
    avatarKeyOrUrl.startsWith('https://') ||
    avatarKeyOrUrl.startsWith('blob:') ||
    avatarKeyOrUrl.startsWith('data:')
  ) {
    return avatarKeyOrUrl
  }
  return fileUrl(avatarKeyOrUrl)
}

function refreshSession() {
  const { session } = getAppContext()
  const user = session.getUser()
  loggedIn.value = session.isLoggedIn()
  nickname.value = user?.nickname || '探秘用户'
  avatarUrl.value = resolveAvatarDisplay(user?.avatarUrl)
}

async function goLogin() {
  await getAppContext().ensureAuthenticated()
  refreshSession()
}

function goProfile() {
  if (!getAppContext().session.isLoggedIn()) return
  void router.push(AccountRoutes.profile)
}

function goHistory() {
  void router.push(EncyclopediaRoutes.history)
}

function goFavorites() {
  if (!getAppContext().session.isLoggedIn()) return
  void router.push(EncyclopediaRoutes.favorites)
}

function goSettings() {
  void router.push(AccountRoutes.settings)
}

async function onLogout() {
  const ok = await confirmDialog({
    title: '退出登录',
    content: '确定退出登录？',
    confirmText: '退出',
    cancelText: '取消',
  })
  if (!ok) return
  getAppContext().logout()
  refreshSession()
}

let unsub: (() => void) | null = null

onMounted(() => {
  refreshSession()
  unsub = getAppContext().session.subscribe(refreshSession)
})

onUnmounted(() => {
  unsub?.()
})
</script>

<template>
  <div class="mine-page cq-page cq-page--with-tab cq-safe-bottom">
    <div class="mine-card cq-card">
      <button
        v-if="loggedIn"
        type="button"
        class="mine-user"
        @click="goProfile"
      >
        <img
          v-if="avatarUrl"
          class="mine-avatar"
          :src="avatarUrl"
          alt=""
        />
        <div v-else class="mine-avatar mine-avatar--placeholder">探</div>
        <div class="mine-user__info">
          <div class="mine-user__name">{{ nickname }}</div>
          <div class="mine-user__hint">点击编辑资料</div>
        </div>
        <span class="mine-user__chevron">›</span>
      </button>
      <div v-else class="mine-guest">
        <div class="mine-guest__title">登录后同步收藏</div>
        <div class="mine-guest__desc">换设备也能查看你收藏的地点</div>
        <button type="button" class="cq-btn-primary mine-guest__btn" @click="goLogin">
          登录
        </button>
      </div>
    </div>

    <div class="cq-list">
      <button
        v-if="loggedIn"
        type="button"
        class="cq-list-cell"
        @click="goFavorites"
      >
        <div class="cq-list-cell__main">
          <div class="cq-list-cell__title">我的收藏</div>
        </div>
        <span class="cq-list-cell__chevron">›</span>
      </button>
      <button type="button" class="cq-list-cell" @click="goHistory">
        <div class="cq-list-cell__main">
          <div class="cq-list-cell__title">浏览记录</div>
        </div>
        <span class="cq-list-cell__chevron">›</span>
      </button>
    </div>

    <div class="cq-list">
      <button type="button" class="cq-list-cell" @click="goSettings">
        <div class="cq-list-cell__main">
          <div class="cq-list-cell__title">设置</div>
        </div>
        <span class="cq-list-cell__chevron">›</span>
      </button>
    </div>

    <div v-if="loggedIn" class="cq-list">
      <button type="button" class="cq-list-cell mine-logout-cell" @click="onLogout">
        <div class="cq-list-cell__main">
          <div class="cq-list-cell__title mine-logout-cell__title">退出登录</div>
        </div>
      </button>
    </div>
  </div>
</template>

<style scoped>
.mine-page {
  padding: 16px 0 24px;
}

.mine-card {
  margin: 0 16px 8px;
  padding: 16px;
}

.mine-user {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  text-align: left;
}

.mine-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--color-fill);
  flex-shrink: 0;
  object-fit: cover;
}

.mine-avatar--placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary);
  font-size: 18px;
  font-weight: 600;
  background: var(--color-primary-soft);
}

.mine-user__info {
  flex: 1;
  min-width: 0;
}

.mine-user__name {
  font-size: 17px;
  font-weight: 600;
  color: var(--color-ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mine-user__hint {
  margin-top: 3px;
  font-size: 13px;
  color: var(--color-ink-muted);
}

.mine-user__chevron {
  color: var(--color-ink-muted);
  font-size: 20px;
  line-height: 1;
}

.mine-logout-cell {
  justify-content: center;
}

.mine-logout-cell__title {
  width: 100%;
  text-align: center;
  color: var(--color-danger);
  font-weight: 500;
}

.mine-guest__title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-ink);
}

.mine-guest__desc {
  margin-top: 6px;
  font-size: 14px;
  color: var(--color-ink-secondary);
  line-height: 1.5;
}

.mine-guest__btn {
  margin-top: 14px;
}
</style>
