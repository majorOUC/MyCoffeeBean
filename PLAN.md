# Coffee Atlas · 完整开发方案

> 我的个人咖啡豆图鉴：记录喝过的每一款豆子、每一次冲煮、以及产地足迹。
> 一个打算长期使用数年的「个人咖啡数据库」，而不是一次性 Demo。

---

## 1. 核心开发原则

- **小步迭代**：严格按 Phase 0 → 7 顺序推进，每个 Phase 结束后：检查代码 → 本地运行验证 → 修复问题 → 更新 README → 总结并等待确认。未经确认不进入下一阶段。
- **简洁优先**：不为「未来可能用到」提前引入复杂技术，先用最简单的方案解决问题。
- **类型安全**：领域模型（Coffee / Tasting）用 TypeScript 类型严格约束，前后端共享同一份类型定义。
- **体验导向**：设计基调是「精品咖啡店 × 个人收藏图鉴 × 极简」，不是后台管理系统；少表格、多卡片与留白，移动端与桌面端同等重要。

## 2. 技术架构

```
┌─────────────────────────────────────────────┐
│  Frontend（React 19 + TS + Vite + Tailwind） │
│  部署于 Cloudflare Pages（静态资源 + CDN）    │
└──────────────────┬──────────────────────────┘
                   │ /api/*（REST + JSON）
┌──────────────────▼──────────────────────────┐
│  API（Cloudflare Workers，无服务器函数）      │
│  路由 / 校验 / 鉴权（可选 Access）            │
└───────┬───────────────────────┬─────────────┘
        │ SQL                   │ S3 API
┌───────▼────────┐      ┌───────▼─────────┐
│ Cloudflare D1  │      │ Cloudflare R2   │
│ 结构化数据      │      │ 咖啡豆包装照片    │
└────────────────┘      └─────────────────┘
```

- **Pages** 托管前端静态资源，全球 CDN，自动 HTTPS。
- **Workers** 提供 REST API（与前端同域 `/api/*`，无跨域问题）。
- **D1**（SQLite）存 Coffee / Tasting 等结构化数据。
- **R2** 存图片，出口流量免费，适合个人相册场景。
- 不购买传统 VPS，零服务器运维。

## 3. 领域模型（Phase 2 落地）

### Coffee（一款咖啡豆）

| 字段                    | 说明                                   |
| ----------------------- | -------------------------------------- |
| id                      | 主键                                   |
| name / roaster          | 名称 / 烘焙商                          |
| country / region / farm | 国家 / 产区 / 庄园                     |
| variety / process       | 品种 / 处理法（水洗、日晒、蜜处理…）   |
| altitude                | 海拔（m）                              |
| roast_level             | 烘焙度（浅 / 中 / 深）                 |
| flavor_notes            | 风味标签数组（Floral、Citrus、Berry…） |
| rating                  | 我的评分（0–5 或 0–100）               |
| description             | 我的笔记                               |
| image_url               | 包装照片（R2 地址）                    |
| created_at / updated_at | 时间戳                                 |

### Tasting（一次冲煮记录）

| 字段                                                | 说明                                    |
| --------------------------------------------------- | --------------------------------------- |
| id / coffee_id                                      | 主键 / 所属咖啡豆（一对多）             |
| date                                                | 饮用日期                                |
| brew_method                                         | V60 / Aeropress / Espresso / Cold Brew… |
| dose / water / temperature / grind_size / brew_time | 粉量 / 水量 / 水温 / 研磨度 / 萃取时间  |
| rating                                              | 本次评分                                |
| notes                                               | 本次笔记                                |

> 关键决策：冲煮信息永远不塞进 Coffee。同一款豆子的 V60 / Aeropress / Espresso / Cold Brew 各自是一条 Tasting。

## 4. 分阶段计划

### ✅ Phase 0 · 项目初始化（本阶段）

- [x] React + Vite + TypeScript 脚手架
- [x] ESLint（flat config）+ Prettier
- [x] Tailwind CSS v4 + 咖啡主题色板（coffee / cream / ink / leaf）
- [x] React Router 路由骨架（6 条路由 + 布局）
- [x] 目录结构（components / pages / layouts / hooks / services / types / utils / data）
- [x] Git 仓库 + 首次提交
- [x] README + .env.example
- [x] 本地 dev / build / lint 全部通过

**验收**：`npm run dev` 打开看到 Coffee Atlas 骨架页，导航可跳转到全部 6 个路由占位页。

### Phase 1 · 前端 UI（纯 Mock，禁用真实数据库）

- 首页 Dashboard：品牌感标题 + 统计数字（豆数 / 国家 / 产区 / 处理法）+ 最近添加 + 最高评分 + 最近饮用
- `/coffees` 卡片图鉴墙：照片、名称、烘焙商、国家、产区、处理法、烘焙度、评分；支持搜索 + 国家 / 处理法 / 烘焙度筛选 + 评分排序
- `/coffees/:id` 咖啡豆档案：全部基本信息 + 风味标签 + 我的评分 / 笔记 + 冲煮记录列表
- `/add` 录入表单（仅前端状态，含图片上传 UI 占位）
- `/stats`、`/map` 占位升级为轻量版或保持占位
- 数据层：`src/data/` 提供 Mock 数据，`src/services/` 定义与后端一致的接口形状，为 Phase 3 换真数据做准备

**验收**：手机 + 桌面两种宽度下完整走通浏览动线；视觉达到「精品咖啡品牌」质感。

### Phase 2 · 数据模型设计

- 编写 D1 建表 SQL（`migrations/0001_init.sql`）：coffees、tastings 及索引
- 前后端共享的 TypeScript 类型（`src/types/`）
- 确定枚举值（处理法 / 烘焙度 / 冲煮方式 / 风味标签表）
- 用 Mock 数据验证模型能覆盖 Phase 1 全部 UI 场景

**验收**：评审表结构；类型定义被前端全面引用且无 `any`。

### Phase 3 · Cloudflare 接入

- 建立 `workers/`（或 Pages Functions）API 项目，接入 wrangler
- D1 本地实例 + 远程实例，migration 流程跑通
- R2 bucket 创建，本地开发用 `wrangler r2` 模拟
- REST API：`GET/POST /api/coffees`、`GET/PUT/DELETE /api/coffees/:id`、`GET/POST /api/coffees/:id/tastings`，可扩展 `GET /api/stats`
- 本地开发方式（`wrangler dev` + `npm run dev`）与部署方式写入 README

**验收**：本地 wrangler dev 跑通全部 API；首次部署到 Cloudflare 测试环境成功。

### Phase 4 · 真正的 CRUD

- 前端切换到真实 API（services 层替换 Mock）
- 添加 / 编辑 / 删除咖啡豆，搜索、筛选、排序走 D1 查询
- R2 图片：上传、预览、删除，URL 存入 D1
- 表单校验与错误提示

**验收**：增删改查 + 图片全流程在部署环境可用。

### Phase 5 · Coffee Map

- 世界地图可视化：Country → Region → Coffees 三级下钻
- 喝过哪些国家 / 产区一目了然（地图库候选：react-simple-maps / Leaflet，Phase 初选型）

**验收**：地图页在移动端可正常交互。

### Phase 6 · Statistics

- 统计 Dashboard：总数 / 国家数 / 产区数 / 处理法数 / 平均评分
- 分布图：国家分布、处理法分布、烘焙度分布、评分分布
- 月度饮用数量趋势

**验收**：统计数据与 D1 真实数据一致。

### Phase 7 · 产品化打磨

- Dark Mode（利用 CSS 变量主题）
- Loading / Empty / Error 状态、Toast
- 图片优化（R2 + CDN 缓存、懒加载、合理尺寸）
- 页面过渡动画、微交互
- SEO / Favicon / Open Graph；视需要加 PWA

**验收**：Lighthouse 桌面端各维度 ≥ 90，移动端体验顺滑。

## 5. 部署上线流程（Phase 3 建立雏形，Phase 7 后正式启用）

### 5.1 前置准备

1. 注册 Cloudflare 账号（免费 Plan 即可）
2. `npm i -D wrangler` 并 `npx wrangler login` 授权
3. （可选）把代码推到 GitHub 仓库，开启 Pages 的 Git 集成自动部署

### 5.2 资源创建（一次性）

```bash
npx wrangler d1 create coffee-atlas-db      # D1 数据库
npx wrangler r2 bucket create coffee-atlas-imgs  # R2 桶
npx wrangler d1 migrations apply coffee-atlas-db --remote  # 远程执行建表
```

`wrangler.toml` 中绑定 D1（`DB`）与 R2（`IMAGES`），敏感配置用 `wrangler secret` 管理。

### 5.3 部署

```bash
npm run build                          # 构建前端
npx wrangler pages deploy dist         # 前端 → Pages
npx wrangler deploy                    # API → Workers
```

后续可配置 GitHub Actions：push 到 main 自动构建 + 部署两端。

### 5.4 域名与收尾

- 免费使用 `*.pages.dev` / `*.workers.dev` 子域；如需自定义域名，在 Cloudflare DNS 中绑定（域名需托管在 Cloudflare）
- 确认 HTTPS、缓存策略、D1 备份策略（`wrangler d1 export` 定期导出）
- （可选）给 `/api/*` 加 Cloudflare Access，防止他人写入

## 6. 里程碑与状态

| Phase | 内容                | 状态                        |
| ----- | ------------------- | --------------------------- |
| 0     | 项目初始化          | ✅ 完成                     |
| 1     | 前端 UI（Mock）     | ✅ 完成                     |
| 2     | 数据模型            | ✅ 完成（migration + 类型） |
| 3     | Cloudflare 接入     | 🟡 本地全通，待部署         |
| 4     | 真实 CRUD + R2 图片 | 🟡 本地全通，待部署         |
| 5     | 咖啡产地地图        | ⬜                          |
| 6     | 统计 Dashboard      | ⬜                          |
| 7     | 产品化打磨 + 上线   | ⬜                          |
