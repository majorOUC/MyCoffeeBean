import { cors } from 'hono/cors'
import { Hono } from 'hono'

import { createToken, hashPassword, verifyPassword, verifyToken } from './auth'
import type { AuthUser } from './auth'
import { Database } from './db'
import type { Env } from './db'
import { RateLimiter } from './rateLimiter'
import type { Coffee, CoffeeInput, CommentInput } from '../../src/types/coffee'

export { RateLimiter }

const app = new Hono<{ Bindings: Env }>()

// 开发期前端 (5173/5174) 与 API (8787) 跨域；生产同域也不受影响
app.use('/api/*', cors())

// 写保护：按 IP 速率限制（Durable Objects 计数），同一 IP 每分钟最多 20 次写操作，
// 防止公网脚本恶意刷接口消耗 R2/D1 额度。GET 不受影响（浏览始终开放）。
const WRITE_LIMIT_PER_MIN = 20

app.use('/api/*', async (c, next) => {
  if (!['GET', 'HEAD', 'OPTIONS'].includes(c.req.method)) {
    const ip = c.req.header('CF-Connecting-IP') ?? 'local-dev'
    const stub = c.env.RATE_LIMITER.get(c.env.RATE_LIMITER.idFromName(ip))
    const check = await stub.fetch(
      `https://limiter/check?limit=${WRITE_LIMIT_PER_MIN}`,
    )
    if (check.status === 429) {
      return c.json({ error: '操作太频繁，请一分钟后再试' }, 429)
    }
  }
  await next()
})

app.get('/api/health', (c) => c.json({ ok: true }))

/* -------------------------------- auth -------------------------------- */

// 注册（仅允许第一个用户成为 admin）
app.post('/api/auth/register', async (c) => {
  const { username, password } = await c.req.json<{
    username: string
    password: string
  }>()
  if (!username?.trim() || !password) {
    return c.json({ error: '用户名和密码不能为空' }, 400)
  }
  if (username.trim().length < 2) {
    return c.json({ error: '用户名至少 2 个字符' }, 400)
  }
  if (password.length < 6) {
    return c.json({ error: '密码至少 6 位' }, 400)
  }

  const db = new Database(c.env.DB)
  const existing = await db.getUserByUsername(username.trim())
  if (existing) {
    return c.json({ error: '用户名已存在' }, 409)
  }

  // 检查是否是第一个用户（自动成为 admin）
  // 简化：如果还没有用户，第一个注册的成为 admin
  const allUsers = await db.listUsers()
  const isFirstUser = allUsers.length === 0

  const passwordHash = await hashPassword(password)
  const user = {
    id: crypto.randomUUID(),
    username: username.trim(),
    passwordHash,
    role: isFirstUser ? 'admin' as const : 'user' as const,
  }
  await db.createUser(user)

  const token = await createToken({
    id: user.id,
    username: user.username,
    role: user.role,
  })

  return c.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
    },
  })
})

// 登录
app.post('/api/auth/login', async (c) => {
  const { username, password } = await c.req.json<{
    username: string
    password: string
  }>()
  if (!username?.trim() || !password) {
    return c.json({ error: '用户名和密码不能为空' }, 400)
  }

  const db = new Database(c.env.DB)
  const userRow = await db.getUserByUsername(username.trim())
  if (!userRow) {
    return c.json({ error: '用户名或密码错误' }, 401)
  }

  const valid = await verifyPassword(password, userRow.password_hash)
  if (!valid) {
    return c.json({ error: '用户名或密码错误' }, 401)
  }

  const token = await createToken({
    id: userRow.id,
    username: userRow.username,
    role: userRow.role as 'admin' | 'user',
  })

  return c.json({
    token,
    user: {
      id: userRow.id,
      username: userRow.username,
      role: userRow.role,
    },
  })
})

// 获取当前用户信息
app.get('/api/auth/me', async (c) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: '未登录' }, 401)
  }

  const token = authHeader.slice(7)
  const authUser = await verifyToken(token)
  if (!authUser) {
    return c.json({ error: '登录已过期，请重新登录' }, 401)
  }

  const db = new Database(c.env.DB)
  const user = await db.getUserById(authUser.id)
  if (!user) {
    return c.json({ error: '用户不存在' }, 404)
  }

  return c.json({ user })
})

// 管理员：列出所有用户
app.get('/api/users', async (c) => {
  const authUser = await getAuthUser(c)
  if (!authUser || authUser.role !== 'admin') {
    return c.json({ error: '需要管理员权限' }, 403)
  }

  const db = new Database(c.env.DB)
  const users = await db.listUsers()
  return c.json(users)
})

// 管理员：更新用户信息
app.put('/api/users/:id', async (c) => {
  const authUser = await getAuthUser(c)
  if (!authUser || authUser.role !== 'admin') {
    return c.json({ error: '需要管理员权限' }, 403)
  }

  const db = new Database(c.env.DB)
  const user = await db.getUserById(c.req.param('id'))
  if (!user) return c.json({ error: '用户不存在' }, 404)

  const input = await c.req.json<{ username?: string; password?: string; role?: string }>()
  const updates: { username?: string; passwordHash?: string; role?: string } = {}

  if (input.username?.trim()) {
    updates.username = input.username.trim()
  }
  if (input.password) {
    updates.passwordHash = await hashPassword(input.password)
  }
  if (input.role && ['admin', 'user'].includes(input.role)) {
    updates.role = input.role
  }

  await db.updateUser(c.req.param('id'), updates)
  const updated = await db.getUserById(c.req.param('id'))
  return c.json({ user: updated })
})

// 管理员：删除用户
app.delete('/api/users/:id', async (c) => {
  const authUser = await getAuthUser(c)
  if (!authUser || authUser.role !== 'admin') {
    return c.json({ error: '需要管理员权限' }, 403)
  }

  const db = new Database(c.env.DB)
  const user = await db.getUserById(c.req.param('id'))
  if (!user) return c.json({ error: '用户不存在' }, 404)

  await db.deleteUser(user.id)
  return c.json({ ok: true })
})

/* ------------------------------- coffees ------------------------------- */

app.get('/api/coffees', async (c) => {
  const db = new Database(c.env.DB)
  const coffees = await db.listCoffees({
    search: c.req.query('search'),
    country: c.req.query('country'),
    process: c.req.query('process'),
    roastLevel: c.req.query('roastLevel'),
    sort: (c.req.query('sort') as 'rating' | 'recent' | 'name' | 'price') ?? 'recent',
  })
  return c.json(coffees)
})

app.get('/api/coffees/:id', async (c) => {
  const db = new Database(c.env.DB)
  const coffee = await db.getCoffee(c.req.param('id'))
  if (!coffee) return c.json({ error: 'not found' }, 404)
  return c.json(coffee)
})

// 添加咖啡豆（需要 admin 权限）
app.post('/api/coffees', async (c) => {
  const authUser = await getAuthUser(c)
  if (!authUser || authUser.role !== 'admin') {
    return c.json({ error: '需要管理员权限' }, 403)
  }

  const input = await c.req.json<CoffeeInput>()
  const invalid = validateCoffee(input)
  if (invalid) return c.json({ error: invalid }, 400)

  const now = new Date().toISOString()
  const coffee: Coffee = {
    ...normalize(input),
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  }
  const db = new Database(c.env.DB)
  await db.createCoffee(coffee)
  return c.json(coffee, 201)
})

// 更新咖啡豆（需要 admin 权限）
app.put('/api/coffees/:id', async (c) => {
  const authUser = await getAuthUser(c)
  if (!authUser || authUser.role !== 'admin') {
    return c.json({ error: '需要管理员权限' }, 403)
  }

  const db = new Database(c.env.DB)
  const existing = await db.getCoffee(c.req.param('id'))
  if (!existing) return c.json({ error: 'not found' }, 404)

  const input = await c.req.json<CoffeeInput>()
  const invalid = validateCoffee(input)
  if (invalid) return c.json({ error: invalid }, 400)

  if (existing.imageUrl && existing.imageUrl !== input.imageUrl) {
    await cleanupImage(c.env, existing.imageUrl)
  }

  const updated: Coffee = {
    ...existing,
    ...normalize(input),
    updatedAt: new Date().toISOString(),
  }
  await db.updateCoffee(existing.id, updated)
  return c.json(updated)
})

// 删除咖啡豆（需要 admin 权限）
app.delete('/api/coffees/:id', async (c) => {
  const authUser = await getAuthUser(c)
  if (!authUser || authUser.role !== 'admin') {
    return c.json({ error: '需要管理员权限' }, 403)
  }

  const db = new Database(c.env.DB)
  const existing = await db.getCoffee(c.req.param('id'))
  if (!existing) return c.json({ error: 'not found' }, 404)
  await cleanupImage(c.env, existing.imageUrl)
  await db.deleteCoffee(existing.id)
  return c.json({ ok: true })
})

/* ------------------------------- comments ------------------------------ */

app.get('/api/coffees/:id/comments', async (c) => {
  const db = new Database(c.env.DB)
  const comments = await db.listComments(c.req.param('id'))
  return c.json(comments)
})

// 发表评论（需要登录）
app.post('/api/coffees/:id/comments', async (c) => {
  const authUser = await getAuthUser(c)
  if (!authUser) {
    return c.json({ error: '请先登录' }, 401)
  }

  const coffeeId = c.req.param('id')
  const db = new Database(c.env.DB)
  const coffee = await db.getCoffee(coffeeId)
  if (!coffee) return c.json({ error: 'coffee not found' }, 404)

  const input = await c.req.json<CommentInput>()
  if (!input.content?.trim()) {
    return c.json({ error: 'content is required' }, 400)
  }

  const comment = {
    id: crypto.randomUUID(),
    coffeeId,
    content: input.content.trim(),
    author: authUser.username,
    userId: authUser.id,
    createdAt: new Date().toISOString(),
  }
  await db.createComment(comment)
  return c.json(comment, 201)
})

// 删除评论（管理员或评论作者可以删除）
app.delete('/api/comments/:id', async (c) => {
  const authUser = await getAuthUser(c)
  if (!authUser) {
    return c.json({ error: '请先登录' }, 401)
  }

  const db = new Database(c.env.DB)
  const comment = await db.getCommentById(c.req.param('id'))
  if (!comment) return c.json({ error: 'comment not found' }, 404)

  // 只有管理员或评论作者可以删除
  if (authUser.role !== 'admin' && comment.userId !== authUser.id) {
    return c.json({ error: '只能删除自己的评论' }, 403)
  }

  await db.deleteComment(comment.id)
  return c.json({ ok: true })
})

/* -------------------------------- stats -------------------------------- */

app.get('/api/stats', async (c) => {
  const db = new Database(c.env.DB)
  return c.json(await db.getStats())
})

/* -------------------------------- images ------------------------------- */

const IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
])
const MAX_IMAGE_BYTES = 8 * 1024 * 1024

app.post('/api/images', async (c) => {
  const authUser = await getAuthUser(c)
  if (!authUser || authUser.role !== 'admin') {
    return c.json({ error: '需要管理员权限' }, 403)
  }

  const form = await c.req.formData()
  const file = form.get('file')
  if (!(file instanceof File)) {
    return c.json({ error: 'file field is required' }, 400)
  }
  if (!IMAGE_TYPES.has(file.type)) {
    return c.json({ error: 'unsupported image type' }, 415)
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return c.json({ error: 'image too large (max 8MB)' }, 413)
  }

  const ext = file.type.split('/')[1].replace('jpeg', 'jpg')
  const key = `${crypto.randomUUID()}.${ext}`
  await c.env.IMAGES.put(key, file.stream(), {
    httpMetadata: { contentType: file.type },
  })
  return c.json({ key, url: `/api/images/${key}` }, 201)
})

app.get('/api/images/:key', async (c) => {
  const object = await c.env.IMAGES.get(c.req.param('key'))
  if (!object) return c.json({ error: 'not found' }, 404)

  const headers = new Headers()
  object.writeHttpMetadata(headers)
  headers.set('Cache-Control', 'public, max-age=31536000, immutable')
  return new Response(object.body, { headers })
})

app.delete('/api/images/:key', async (c) => {
  const authUser = await getAuthUser(c)
  if (!authUser || authUser.role !== 'admin') {
    return c.json({ error: '需要管理员权限' }, 403)
  }

  await c.env.IMAGES.delete(c.req.param('key'))
  return c.json({ ok: true })
})

// Pages 部署时，未匹配 /api/* 的请求回退到静态资源（SPA 由前端路由接管）
app.all('*', async (c) => {
  if (c.env.ASSETS) return c.env.ASSETS.fetch(c.req.raw)
  return c.text('Not Found', 404)
})

/* ------------------------------- helpers ------------------------------- */

/** 从请求中提取认证用户 */
async function getAuthUser(c: {
  req: { header: (name: string) => string | undefined }
}): Promise<AuthUser | null> {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.slice(7)
  return verifyToken(token)
}

function validateCoffee(input: CoffeeInput): string | null {
  if (!input.name?.trim()) return 'name is required'
  if (!input.roaster?.trim()) return 'roaster is required'
  if (!input.country?.trim()) return 'country is required'
  if (!input.process) return 'process is required'
  if (!input.roastLevel) return 'roastLevel is required'
  return null
}

/** 删除 coffee 引用的 R2 图片（仅清理本 API 管理的对象） */
async function cleanupImage(env: Env, imageUrl?: string): Promise<void> {
  if (!imageUrl?.startsWith('/api/images/')) return
  const key = imageUrl.slice('/api/images/'.length)
  await env.IMAGES.delete(key)
}

function normalize(input: CoffeeInput): CoffeeInput {
  // 计算克价：总价 / 总克数
  let pricePerGram = input.pricePerGram
  if (input.totalGrams && input.totalPrice && input.totalGrams > 0) {
    pricePerGram = Math.round((input.totalPrice / input.totalGrams) * 100) / 100
  }

  return {
    ...input,
    name: input.name.trim(),
    roaster: input.roaster.trim(),
    country: input.country.trim(),
    region: (input.region ?? '').trim(),
    farm: input.farm?.trim() || undefined,
    variety: input.variety?.trim() || undefined,
    description: input.description?.trim() || undefined,
    flavorNotes: input.flavorNotes ?? [],
    rating: Math.min(5, Math.max(0, Math.round((input.rating ?? 0) * 2) / 2)),
    pricePerGram,
  }
}

export default app
