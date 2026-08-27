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

**最后更新**：2026-08-27

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

### 当前问题

- [ ] 日记页面加载不出来（API 正常，可能是前端权限检查问题）
- [ ] 下拉框文字与箭头重叠问题（已恢复原生样式，但可能还有问题）

### 待办

- [ ] 修复日记页面加载问题
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

1. 修复日记页面加载问题
2. 修复下拉框显示问题
3. 为管理员账号设置 display_name
4. 清理测试用户数据
5. 继续 Phase 5/6/7 的完善（如果需要）
