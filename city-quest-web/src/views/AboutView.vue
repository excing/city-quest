<script setup lang="ts">
import PageHeader from '../components/PageHeader.vue'
</script>

<template>
  <div class="static-page cq-page cq-safe-bottom">
    <PageHeader title="关于" />
    <div class="static-hero">
      <div class="static-hero__name">我的城市探秘</div>
      <div class="static-hero__tagline">在地图上发现大理值得一去的地点</div>
    </div>
    <div class="static-body">
      <p class="static-p">
        「我的城市探秘」帮助你在地图上浏览当地美食、景点与其他地点百科，查看介绍并收藏感兴趣的地点。
      </p>
      <p class="static-p">
        当前版本聚焦大理。内容由运营维护上架；你可自由浏览地图与详情，登录后可同步收藏到账号。
      </p>
      <p class="static-p static-muted">版本 v1 · 大理 · Web</p>
      <p class="static-p static-muted">
        地图瓦片 © OpenStreetMap contributors
      </p>
    </div>
  </div>
</template>

<style scoped>
.static-hero {
  padding: 32px 24px 16px;
  text-align: center;
}

.static-hero__name {
  font-size: 22px;
  font-weight: 700;
  color: var(--color-ink);
}

.static-hero__tagline {
  margin-top: 8px;
  font-size: 14px;
  color: var(--color-ink-secondary);
}

.static-body {
  padding: 8px 24px 32px;
}

.static-p {
  font-size: 15px;
  line-height: 1.7;
  color: var(--color-ink);
  margin: 0 0 14px;
}

.static-muted {
  color: var(--color-ink-muted);
  font-size: 13px;
}
</style>
