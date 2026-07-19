<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getAppContext } from '../app-context'
import { AccountRoutes } from '../features/account/public'
import PageHeader from '../components/PageHeader.vue'

const router = useRouter()
const mapShowPoi = ref(false)

function refreshPreferences() {
  mapShowPoi.value = getAppContext().getMapShowPoi()
}

function onMapShowPoiChange(e: Event) {
  const checked = (e.target as HTMLInputElement).checked
  mapShowPoi.value = checked
  getAppContext().setMapShowPoi(checked)
}

function goAbout() {
  void router.push(AccountRoutes.about)
}

onMounted(refreshPreferences)
</script>

<template>
  <div class="settings-page cq-page cq-safe-bottom">
    <PageHeader title="设置" />

    <div class="cq-list">
      <div class="cq-list-cell settings-switch-cell">
        <div class="cq-list-cell__main">
          <div class="cq-list-cell__title">显示地图 POI</div>
          <div class="cq-list-cell__sub">
            开启后保留偏好（Web 端 OSM 底图无系统 POI 层）
          </div>
        </div>
        <label class="settings-switch">
          <input
            type="checkbox"
            :checked="mapShowPoi"
            @change="onMapShowPoiChange"
          />
          <span class="settings-switch__ui" />
        </label>
      </div>
    </div>

    <div class="cq-list">
      <button type="button" class="cq-list-cell" @click="goAbout">
        <div class="cq-list-cell__main">
          <div class="cq-list-cell__title">关于</div>
        </div>
        <span class="cq-list-cell__chevron">›</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.settings-switch-cell {
  gap: 12px;
}

.settings-switch {
  position: relative;
  width: 44px;
  height: 26px;
  flex-shrink: 0;
}

.settings-switch input {
  opacity: 0;
  width: 0;
  height: 0;
  position: absolute;
}

.settings-switch__ui {
  position: absolute;
  inset: 0;
  background: var(--color-line-strong);
  border-radius: 999px;
  transition: background 0.15s ease;
}

.settings-switch__ui::after {
  content: '';
  position: absolute;
  width: 22px;
  height: 22px;
  left: 2px;
  top: 2px;
  background: #fff;
  border-radius: 50%;
  transition: transform 0.15s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
}

.settings-switch input:checked + .settings-switch__ui {
  background: var(--color-primary);
}

.settings-switch input:checked + .settings-switch__ui::after {
  transform: translateX(18px);
}
</style>
