# ☕ Coffee Atlas

我的个人咖啡豆图鉴 —— 一个用来长期记录喝过的咖啡豆、冲煮经历与产地足迹的个人网站。

> 目标不是做一个 CRUD Demo，而是一座可以陪伴自己很多年的「个人咖啡数据库」。

## 技术栈

| 层           | 技术                                 |
| ------------ | ------------------------------------ |
| 前端         | React 19 + TypeScript + Vite         |
| 样式         | Tailwind CSS v4                      |
| 路由         | React Router v7                      |
| 代码质量     | ESLint (flat config) + Prettier      |
| 部署（规划） | Cloudflare Pages + Workers + D1 + R2 |

## 本地开发

```bash
npm install    # 安装依赖
npm run dev    # 启动开发服务器（默认 http://localhost:5173）
```

其他常用命令：

```bash
npm run build         # 类型检查 + 生产构建
npm run preview       # 预览生产构建
npm run lint          # ESLint 检查
npm run format        # Prettier 格式化
npm run format:check  # Prettier 检查
```

## 目录结构

```
src/
├── components/   # 可复用 UI 组件
├── pages/        # 路由页面
├── layouts/      # 页面布局（导航 / 页脚）
├── hooks/        # 自定义 React Hooks
├── services/     # 数据服务层（API 客户端，Phase 3 起）
├── types/        # TypeScript 类型定义
├── utils/        # 工具函数
└── data/         # 静态 / Mock 数据（Phase 1）
```

## 开发路线

项目按 Phase 0 → 7 小步迭代，每个 Phase 完成后验收再进入下一个。完整计划见 [PLAN.md](./PLAN.md)。

## 环境变量

参考 `.env.example`，复制为 `.env` 后按需填写（Phase 3 起才会用到）。
