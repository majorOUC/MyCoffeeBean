# ☕ Coffee Atlas

我的个人咖啡豆图鉴 —— 一个用来长期记录喝过的咖啡豆、冲煮经历与产地足迹的个人网站。

> 目标不是做一个 CRUD Demo，而是一座可以陪伴自己很多年的「个人咖啡数据库」。

## 技术栈

| 层       | 技术                            |
| -------- | ------------------------------- |
| 前端     | React 19 + TypeScript + Vite    |
| 样式     | Tailwind CSS v4                 |
| 路由     | React Router v7                 |
| API      | Cloudflare Workers (Hono)       |
| 数据库   | Cloudflare D1（SQLite）         |
| 图片存储 | Cloudflare R2                   |
| 代码质量 | ESLint (flat config) + Prettier |

## 本地开发

需要两个终端：

```bash
npm install              # 安装依赖

# 终端 1：启动 API（本地模拟 D1 + R2，无需 Cloudflare 账号）
npm run db:migrate:local # 首次运行：建表
npm run dev:api          # http://localhost:8787

# 终端 2：启动前端
npm run dev              # http://localhost:5173
```

前端默认连接本地 API（`.env.development`）。只想看 UI 不起 API 时，
设置 `VITE_USE_MOCK=true` 后重启 `npm run dev` 即可回到 Mock 数据。

其他命令：

```bash
npm run build             # 类型检查（前端 + Workers）+ 生产构建
npm run lint              # ESLint 检查
npm run format            # Prettier 格式化
npm run db:migrate:remote # 部署时：对远程 D1 执行 migrations
npm run deploy:pages      # 构建并部署到 Cloudflare Pages（前端 + 同域 API）
```

## 线上部署

线上地址：<https://coffee-atlas-31p.pages.dev>（`*.pages.dev` 在部分网络需代理访问）

部署架构：前端静态资源与 API（`dist/_worker.js`，Hono）同域部署在 Cloudflare
Pages，`/api/*` 无跨域；D1 与 R2 通过根目录 `wrangler.toml` 绑定。
更新部署只需 `npm run deploy:pages`。
另有独立 Worker 入口 `npm run deploy:api`（`coffee-atlas-api.<子域>.workers.dev`），
与 Pages 共用同一 D1/R2，可作备用。

## API 一览

| 方法   | 路径                      | 说明                                     |
| ------ | ------------------------- | ---------------------------------------- |
| GET    | /api/coffees              | 列表（search/country/… 筛选，sort 排序） |
| GET    | /api/coffees/:id          | 详情                                     |
| POST   | /api/coffees              | 新增                                     |
| PUT    | /api/coffees/:id          | 更新                                     |
| DELETE | /api/coffees/:id          | 删除（含关联 tastings 与图片）           |
| GET    | /api/coffees/:id/tastings | 冲煮记录列表                             |
| POST   | /api/coffees/:id/tastings | 新增冲煮记录                             |
| GET    | /api/tastings/recent      | 最近饮用                                 |
| GET    | /api/stats                | 汇总统计                                 |
| POST   | /api/images               | 上传图片到 R2                            |
| GET    | /api/images/:key          | 读取图片（长缓存）                       |
| DELETE | /api/images/:key          | 删除图片                                 |

## 目录结构

```
src/
├── components/   # 可复用 UI 组件
├── pages/        # 路由页面
├── layouts/      # 页面布局（导航 / 页脚）
├── hooks/        # 自定义 React Hooks
├── services/     # 数据服务层（Mock / HTTP 双实现，同一接口）
├── types/        # TypeScript 类型定义（前后端共享）
├── utils/        # 工具函数
└── data/         # 常量与 Mock 种子数据

workers/
├── src/          # Cloudflare Worker（Hono REST API）
├── migrations/   # D1 建表 SQL
└── wrangler.jsonc
```

## 开发路线

项目按 Phase 0 → 7 小步迭代，每个 Phase 完成后验收再进入下一个。完整计划见 [PLAN.md](./PLAN.md)。

## 环境变量

参考 `.env.example`。本地开发默认值见 `.env.development`。
