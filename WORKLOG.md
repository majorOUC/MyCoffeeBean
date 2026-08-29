# Coffee Atlas 项目工作日志

## 项目概述

**Coffee Atlas** —— 个人咖啡豆图鉴网站，记录喝过的每一款豆子、冲煮经历与产地足迹。

**技术栈**：
- 前端：React 19 + TypeScript + Vite + Tailwind CSS v3 + React Router v7
- 后端：Cloudflare Workers (Hono) + D1 (SQLite) + R2 (图片存储)
- 部署：Cloudflare Pages（前端 + API 同域，`dist/_worker.js`）
- 认证：JWT（PBKDF2-SHA256 密码哈希）

**线上地址**：https://coffee-atlas-31p.pages.dev

**GitHub**：https://github.com/majorOUC/MyCoffeeBean

---

## 当前状态

**最后更新**：2026-08-29

### 已完成

- [x] Phase 0：项目初始化（Vite + React + TS + Tailwind v3 + Router + ESLint/Prettier）
- [x] Phase 1：前端 UI（首页、图鉴、详情、表单、统计、地图）
- [x] Phase 2：数据模型（coffees、comments、users、diary 表）
- [x] Phase 3：Cloudflare 接入（Workers + D1 + R2）
- [x] Phase 4：真实 CRUD + R2 图片上传
- [x] Phase 5：咖啡产地地图（d3-geo + 本地拓扑数据）
- [x] Phase 6：统计 Dashboard（分布图 + 月度趋势）
- [x] Phase 7：Dark Mode、Toast、Error 状态、SEO、动画
- [x] 用户系统：注册/登录、JWT 认证、三种角色（user/publisher/admin）
- [x] 权限控制：admin 可管理所有内容、publisher 可发布豆子、user 仅浏览评论
- [x] 用户管理页面（仅管理员可见）
- [x] 咖啡日记功能（仅管理员可见）
- [x] 注册表单：昵称（可中文）+ 账号（英文）+ 密码
- [x] 按克价排序功能
- [x] 移动端兼容性（百度浏览器、侧滑返回手势）
- [x] 部署到 Cloudflare Pages
- [x] 日记页面加载问题已解决（2026-08-27 线上实测验证）
- [x] 主页手冲参数展示卡（2026-08-27 已上线并验证）
- [x] 安全加固（2026-08-29 已上线）：JWT 密钥移入 `JWT_SECRET` secret
      （Pages 与独立 Worker 两处同值）；token 改标准秒级 exp；带无效 token
      的请求统一返回 401「登录已过期」（与 403 权限不足区分）；前端启动时
      调 /api/auth/me 校验并刷新登录态，失效自动清理。
      ⚠️ 换密钥后所有用户需重新登录一次。
- [x] 受限页统一守卫组件 AccessDenied：未登录显示「请先登录 + 去登录」，
      已登录权限不足显示「权限不足 + 返回」（6 个页面接入）
- [x] 下拉框文字压箭头修复：三处 select 右侧内边距加大到 pr-10（原生箭头保留）
- [x] GitHub Actions 自动部署 workflow（.github/workflows/deploy.yml），
      lint/build 全绿，等待配置仓库 Secrets 后生效

### 当前问题

- [ ] CI 待生效：需在 GitHub 仓库 Settings → Secrets and variables → Actions
      添加 `CLOUDFLARE_API_TOKEN`（权限：Pages Edit + D1 Edit +
      Workers Scripts Edit）和 `CLOUDFLARE_ACCOUNT_ID`，然后在 Actions 页
      re-run 或手动 workflow_dispatch
- [ ] 本机 wrangler/workerd 启动即崩溃（access violation，疑似 VC++ 运行库问题），
      `db:migrate:local` / `dev:api` 无法运行，本地开发需修复环境或用临时 mock API 联调。

### 待办

- [ ] 修复下拉框显示问题
- [ ] 为现有管理员账号添加 display_name 字段
- [ ] 清理测试用户数据

---

## 重要架构决策

1. **Tailwind CSS v3**：v4 使用 `@layer` CSS 特性，百度浏览器不支持，降级到 v3
2. **Pages 同域 API**：`dist/_worker.js` 让前端和 API 同域，避免跨域问题
3. **Durable Objects 限流**：每 IP 每分钟 20 次写操作，防止恶意刷接口
4. **JWT UTF-8 编码**：使用 `unescape/encodeURIComponent` 处理中文字符
5. **Vite 代理**：本地开发时 `/api/*` 代理到 wrangler dev，与生产架构一致

---

## 关键文件路径

- 前端源码：`src/`
- 后端源码：`workers/src/`
- 数据库 migration：`workers/migrations/`
- 类型定义：`src/types/coffee.ts`
- 服务接口：`src/services/types.ts`
- 配置文件：`vite.config.ts`、`tailwind.config.js`、`workers/wrangler.jsonc`、`wrangler.toml`

---

## 环境变量

- `.env.development`：本地开发配置（`VITE_API_BASE_URL=`、`VITE_USE_MOCK=false`）
- `.env.production`：生产环境配置（`VITE_API_BASE_URL=`、`VITE_USE_MOCK=false`）
- `workers/.dev.vars`：本地 Worker 密钥（不入库）

---

## 部署命令

```bash
npm run build          # 构建前端 + Worker
npm run deploy:pages   # 部署到 Cloudflare Pages
npm run deploy:api     # 部署独立 Worker（备用）
npm run db:migrate:remote  # 执行远程 D1 migration
```

---

## 当前用户

- **管理员**：账号 `15588753313`，密码 `wmz1005533`，昵称待设置
- **其他用户**：`15577777777`（普通用户）

---

## 下一步建议

1. 配置 GitHub Secrets（CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID）使 CI 生效
2. 为管理员账号设置 display_name
3. 清理测试用户数据
4. 修复本机 workerd（装 VC++ 运行库）恢复本地 wrangler 开发
5. 继续 Phase 5/6/7 的完善（如果需要）

---

## 手冲参数展示卡（brew card）

2026-08-27 新增。主页「☕ 手冲参数」单条常驻卡片：基本参数（方案名/粉量/总水量/
粉水比/水温/研磨度）+ 分段冲煮（闷蒸时间+克重、第一/二/三段克重）+ 一张照片。
访客可见；仅管理员可编辑（卡片右上"编辑"按钮 → `/brew-card/edit`）。

- 数据：单行表 `brew_card`（id 固定 `'default'`，upsert），migration `0008_brew_card.sql`
- API：`GET /api/brew-card` 公开（未设置返回 null）；`PUT /api/brew-card` 仅 admin，
  替换图片时用 `cleanupImage` 清理旧 R2 对象；上传复用 `POST /api/images`
- 前端：`BrewCard`/`BrewCardInput` 类型；服务层 `getBrewCard`/`saveBrewCard`
  （http + mock 双实现）；展示在 `HomePage` 统计与最高评分之间；
  空状态对访客隐藏、对管理员显示占位链接
- 注意：所有参数存 TEXT（允许 "88-92" 区间写法），单位由 UI 显示；空段不显示
