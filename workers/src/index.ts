import { cors } from 'hono/cors'
import { Hono } from 'hono'

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

/* ------------------------------- coffees ------------------------------- */

app.get('/api/coffees', async (c) => {
  const db = new Database(c.env.DB)
  const coffees = await db.listCoffees({
    search: c.req.query('search'),
    country: c.req.query('country'),
    process: c.req.query('process'),
    roastLevel: c.req.query('roastLevel'),
    sort: (c.req.query('sort') as 'rating' | 'recent' | 'name') ?? 'recent',
  })
  return c.json(coffees)
})

app.get('/api/coffees/:id', async (c) => {
  const db = new Database(c.env.DB)
  const coffee = await db.getCoffee(c.req.param('id'))
  if (!coffee) return c.json({ error: 'not found' }, 404)
  return c.json(coffee)
})

app.post('/api/coffees', async (c) => {
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

app.put('/api/coffees/:id', async (c) => {
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

app.delete('/api/coffees/:id', async (c) => {
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

app.post('/api/coffees/:id/comments', async (c) => {
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
    author: input.author?.trim() || '匿名',
    createdAt: new Date().toISOString(),
  }
  await db.createComment(comment)
  return c.json(comment, 201)
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
  await c.env.IMAGES.delete(c.req.param('key'))
  return c.json({ ok: true })
})

// Pages 部署时，未匹配 /api/* 的请求回退到静态资源（SPA 由前端路由接管）
app.all('*', async (c) => {
  if (c.env.ASSETS) return c.env.ASSETS.fetch(c.req.raw)
  return c.text('Not Found', 404)
})

/* ------------------------------- helpers ------------------------------- */

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
  }
}

export default app
