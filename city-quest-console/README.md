# city-quest-console

「我的城市探秘」运营后台（Vue 3 + Vite + Pinia + Tailwind）。

对接 `city-quest-server` 的 `/api/v1/admin/*`。

## 本地开发

```bash
cp .env.example .env
# VITE_API_BASE_URL=http://127.0.0.1:8787

npm install
npm run dev
# http://127.0.0.1:5173
```

确保 API 已启动，且 Worker `CORS_ORIGIN` 包含 `http://localhost:5173`。

管理员账号来自服务端环境变量 `ADMIN_USERNAME` / `ADMIN_PASSWORD`（明文配置）。

## 功能

- 登录 / 退出
- 百科列表（状态筛选、快捷上下架）
- 新建 / 编辑（GCJ-02、标签、图片上传、删除）
