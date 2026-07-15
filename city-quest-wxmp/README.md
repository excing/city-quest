# city-quest-wxmp

「我的城市探秘」微信**原生 TypeScript** 小程序。

## 架构

权威文档：`docs/研发/小程序架构-我的城市探秘.md`（父仓）。

```text
miniprogram/
  core/          内核端口（http / session / storage / state / map / …）
  shared/        与业务无关的工具
  features/      业务模块（encyclopedia、account）
  pages/         薄页面入口（主包）
  package-account/  账户与低频页分包
  app-context.ts composition root
```

扩展新业务：新建 `features/<name>/` + `public.ts` + 注册路由；不要改 core 公共语义。

## 开发

1. 用微信开发者工具打开本目录（`project.config.json` 的 `miniprogramRoot` 为 `miniprogram/`）。
2. 配置 `miniprogram/core/config/env.ts` 中的 API 地址（develop 默认 `http://127.0.0.1:8787`）。
3. 启动 `city-quest-server`（`wrangler dev`）。
4. 详情页可带 `?id=<encyclopediaId>` 验证 `openDetail`。

```bash
npm install
npm run typecheck
npm test
```

## 说明

- 地图 marker：按类型色 **Canvas 动态画圆点**（`features/encyclopedia/presentation/marker-icon-*`），缓存到用户目录；仅保留 `assets/markers/default.png` 作失败回退。`<map>` 不支持 SVG `iconPath`。
- 完整交互与视觉以父仓 `docs/` 中 PRD / UIUX / 架构文档为准。
- Tab 图标未配置时可在开发者工具中暂用文字 Tab（已配置 text）。
- 切勿将 `WECHAT_SECRET` / `JWT_SECRET` 写入小程序。
