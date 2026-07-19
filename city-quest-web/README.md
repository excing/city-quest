# city-quest-web

「我的城市探秘」Web 端 — 由 `city-quest-wxmp` 用 **Vue 3 + TypeScript + Vite** 重写。

## 功能

- **首页地图**：Leaflet + OpenStreetMap 瓦片  
  `https://tile.openstreetmap.de/{z}/{x}/{y}.png`
- 点位预览卡、详情、收藏、浏览记录
- 我的 / 资料 / 设置 / 关于
- 本地会话与浏览记录（localStorage）
- 与 `city-quest-server` 同一套 REST 信封

## 技术栈

- Vue 3 (Composition API) + Vue Router + Pinia
- Leaflet 地图
- 架构对齐小程序：composition root（`app-context`）、domain / application / infrastructure

## 开发

```bash
cd city-quest-web
npm install
npm run dev
```

开发服务器默认 `http://localhost:5173`，并通过 Vite 代理把 `/api`、`/config` 转到：

- 默认：`https://cityquest.jiaderen.com`
- 可覆盖：`VITE_DEV_PROXY_TARGET=http://127.0.0.1:8787 npm run dev`

## 环境变量

| 变量 | 说明 |
|------|------|
| `VITE_API_BASE_URL` | API 根地址；开发默认空（走同源代理） |
| `VITE_DEV_PROXY_TARGET` | 仅 dev server 代理目标 |

## 登录说明

小程序使用微信 `wx.login`。Web 端走服务端已支持的 **dev code** 路径：

- `POST /api/v1/auth/wechat/login`，`code = dev:web_<deviceId>`
- 需服务端 `WECHAT_APPID=dev`，或任意环境接受 `dev:` 前缀 code（见 `city-quest-server` `code2Session`）

## 构建

```bash
npm run build
npm run preview
```

## 目录

```
src/
  app-context.ts          # composition root
  core/                   # http, session, storage, map
  features/
    encyclopedia/         # 点位 / 收藏 / 浏览记录
    account/              # 登录 / 资料
  views/                  # 页面
  components/             # TabBar, PageHeader, ListCover
  styles/                 # design tokens
```

## 坐标说明

服务端与小程序使用 **GCJ-02**。OSM 底图为 WGS84，中国境内点位可能有轻微偏移；与小程序数据保持一致，未做坐标转换。
