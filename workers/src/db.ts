import type { Coffee, Comment, DiaryEntry, BrewCard } from '../../src/types/coffee'

/** Worker 绑定资源 */
export interface Env {
  DB: D1Database
  IMAGES: R2Bucket
  /** Pages 环境自动提供：回退到静态资源；独立 Worker 部署时不存在 */
  ASSETS?: { fetch: typeof fetch }
  /** 写接口速率限制器（Durable Objects） */
  RATE_LIMITER: DurableObjectNamespace
}

/** D1 中 coffees 表的行结构（snake_case） */
interface CoffeeRow {
  id: string
  name: string
  roaster: string
  country: string
  region: string
  farm: string | null
  variety: string | null
  process: string
  altitude: number | null
  roast_level: string
  flavor_notes: string
  rating: number
  price_per_gram: number | null
  description: string | null
  image_url: string | null
  created_at: string
  updated_at: string
}

/** D1 中 comments 表的行结构 */
interface CommentRow {
  id: string
  coffee_id: string
  content: string
  author: string
  user_id: string | null
  created_at: string
}

/** D1 中 users 表的行结构 */
interface UserRow {
  id: string
  username: string
  display_name: string
  password_hash: string
  role: string
  created_at: string
}

/** 用户信息（不含密码） */
export interface User {
  id: string
  username: string
  displayName: string
  role: 'admin' | 'publisher' | 'user'
  createdAt: string
}

/** D1 中 diary 表的行结构 */
interface DiaryRow {
  id: string
  title: string
  content: string
  created_at: string
  updated_at: string
}

/** brew_card 单行配置的固定主键 */
const BREW_CARD_ID = 'default'

/** D1 中 brew_card 表的行结构 */
interface BrewCardRow {
  id: string
  bean_name: string
  dose: string
  water: string
  ratio: string
  temperature: string
  grind_size: string
  bloom_time: string
  bloom_water: string
  stage1_water: string
  stage2_water: string
  stage3_water: string
  image_url: string | null
  updated_at: string
}

function rowToCoffee(row: CoffeeRow): Coffee {
  return {
    id: row.id,
    name: row.name,
    roaster: row.roaster,
    country: row.country,
    region: row.region,
    farm: row.farm ?? undefined,
    variety: row.variety ?? undefined,
    process: row.process as Coffee['process'],
    altitude: row.altitude ?? undefined,
    roastLevel: row.roast_level as Coffee['roastLevel'],
    flavorNotes: JSON.parse(row.flavor_notes) as string[],
    rating: row.rating,
    pricePerGram: row.price_per_gram ?? undefined,
    description: row.description ?? undefined,
    imageUrl: row.image_url ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function rowToComment(row: CommentRow): Comment {
  return {
    id: row.id,
    coffeeId: row.coffee_id,
    content: row.content,
    author: row.author,
    userId: row.user_id ?? undefined,
    createdAt: row.created_at,
  }
}

function rowToUser(row: UserRow): User {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name || row.username,
    role: row.role as 'admin' | 'publisher' | 'user',
    createdAt: row.created_at,
  }
}

function rowToDiary(row: DiaryRow): DiaryEntry {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function rowToBrewCard(row: BrewCardRow): BrewCard {
  return {
    beanName: row.bean_name,
    dose: row.dose || undefined,
    water: row.water || undefined,
    ratio: row.ratio || undefined,
    temperature: row.temperature || undefined,
    grindSize: row.grind_size || undefined,
    bloomTime: row.bloom_time || undefined,
    bloomWater: row.bloom_water || undefined,
    stage1Water: row.stage1_water || undefined,
    stage2Water: row.stage2_water || undefined,
    stage3Water: row.stage3_water || undefined,
    imageUrl: row.image_url ?? undefined,
    updatedAt: row.updated_at,
  }
}

export interface ListParams {
  search?: string
  country?: string
  process?: string
  roastLevel?: string
  sort?: 'rating' | 'recent' | 'name' | 'price'
}

const SORT_SQL: Record<string, string> = {
  rating: 'rating DESC',
  name: 'name COLLATE NOCASE ASC',
  recent: 'datetime(created_at) DESC',
  price: 'price_per_gram IS NULL ASC, price_per_gram ASC',
}

export class Database {
  private db: D1Database

  constructor(db: D1Database) {
    this.db = db
  }

  async listCoffees(params: ListParams = {}): Promise<Coffee[]> {
    const where: string[] = []
    const binds: unknown[] = []
    if (params.country) {
      where.push('country = ?')
      binds.push(params.country)
    }
    if (params.process) {
      where.push('process = ?')
      binds.push(params.process)
    }
    if (params.roastLevel) {
      where.push('roast_level = ?')
      binds.push(params.roastLevel)
    }
    if (params.search) {
      where.push(
        "(name || ' ' || roaster || ' ' || country || ' ' || region || ' ' || COALESCE(farm,'') || ' ' || COALESCE(variety,'') || ' ' || flavor_notes) LIKE ? COLLATE NOCASE",
      )
      binds.push(`%${params.search}%`)
    }
    const order = SORT_SQL[params.sort ?? 'recent'] ?? SORT_SQL.recent
    const sql = `SELECT * FROM coffees ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY ${order}`
    const { results } = await this.db
      .prepare(sql)
      .bind(...binds)
      .all<CoffeeRow>()
    return results.map(rowToCoffee)
  }

  async getCoffee(id: string): Promise<Coffee | null> {
    const row = await this.db
      .prepare('SELECT * FROM coffees WHERE id = ?')
      .bind(id)
      .first<CoffeeRow>()
    return row ? rowToCoffee(row) : null
  }

  async createCoffee(coffee: Coffee): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO coffees (id, name, roaster, country, region, farm, variety, process, altitude, roast_level, flavor_notes, rating, price_per_gram, description, image_url, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        coffee.id,
        coffee.name,
        coffee.roaster,
        coffee.country,
        coffee.region,
        coffee.farm ?? null,
        coffee.variety ?? null,
        coffee.process,
        coffee.altitude ?? null,
        coffee.roastLevel,
        JSON.stringify(coffee.flavorNotes),
        coffee.rating,
        coffee.pricePerGram ?? null,
        coffee.description ?? null,
        coffee.imageUrl ?? null,
        coffee.createdAt,
        coffee.updatedAt,
      )
      .run()
  }

  async updateCoffee(id: string, coffee: Coffee): Promise<void> {
    await this.db
      .prepare(
        `UPDATE coffees SET name=?, roaster=?, country=?, region=?, farm=?, variety=?, process=?, altitude=?, roast_level=?, flavor_notes=?, rating=?, price_per_gram=?, description=?, image_url=?, updated_at=? WHERE id=?`,
      )
      .bind(
        coffee.name,
        coffee.roaster,
        coffee.country,
        coffee.region,
        coffee.farm ?? null,
        coffee.variety ?? null,
        coffee.process,
        coffee.altitude ?? null,
        coffee.roastLevel,
        JSON.stringify(coffee.flavorNotes),
        coffee.rating,
        coffee.pricePerGram ?? null,
        coffee.description ?? null,
        coffee.imageUrl ?? null,
        coffee.updatedAt,
        id,
      )
      .run()
  }

  async deleteCoffee(id: string): Promise<boolean> {
    const result = await this.db
      .prepare('DELETE FROM coffees WHERE id = ?')
      .bind(id)
      .run()
    return (result.meta.changes ?? 0) > 0
  }

  async listComments(coffeeId: string): Promise<Comment[]> {
    const { results } = await this.db
      .prepare('SELECT * FROM comments WHERE coffee_id = ? ORDER BY created_at DESC')
      .bind(coffeeId)
      .all<CommentRow>()
    return results.map(rowToComment)
  }

  async createComment(comment: Comment): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO comments (id, coffee_id, content, author, user_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        comment.id,
        comment.coffeeId,
        comment.content,
        comment.author,
        comment.userId ?? null,
        comment.createdAt,
      )
      .run()
  }

  async deleteComment(id: string): Promise<boolean> {
    const result = await this.db
      .prepare('DELETE FROM comments WHERE id = ?')
      .bind(id)
      .run()
    return (result.meta.changes ?? 0) > 0
  }

  async getCommentById(id: string): Promise<Comment | null> {
    const row = await this.db
      .prepare('SELECT * FROM comments WHERE id = ?')
      .bind(id)
      .first<CommentRow>()
    return row ? rowToComment(row) : null
  }

  async getStats() {
    const overview = await this.db
      .prepare(
        `SELECT
           COUNT(*) AS totalCoffees,
           COUNT(DISTINCT country) AS totalCountries,
           COUNT(DISTINCT region) AS totalRegions,
           COUNT(DISTINCT process) AS totalProcesses,
           ROUND(AVG(rating), 1) AS averageRating
         FROM coffees`,
      )
      .first<{
        totalCoffees: number
        totalCountries: number
        totalRegions: number
        totalProcesses: number
        averageRating: number | null
      }>()

    const comments = await this.db
      .prepare('SELECT COUNT(*) AS n FROM comments')
      .first<{ n: number }>()

    const [countryDist, processDist, roastDist, ratingDist, monthlyComments] =
      await Promise.all([
        this.distBy('country', 'coffees'),
        this.distBy('process', 'coffees'),
        this.distBy('roast_level', 'coffees'),
        this.distBy('rating', 'coffees'),
        this.distBy("substr(created_at, 1, 7)", 'comments'),
      ])

    return {
      totalCoffees: overview?.totalCoffees ?? 0,
      totalCountries: overview?.totalCountries ?? 0,
      totalRegions: overview?.totalRegions ?? 0,
      totalProcesses: overview?.totalProcesses ?? 0,
      totalComments: comments?.n ?? 0,
      averageRating: overview?.averageRating ?? 0,
      countryDist,
      processDist,
      roastDist,
      ratingDist,
      monthlyComments,
    }
  }

  /** 按 SQL 表达式聚合分布，count 降序 */
  private async distBy(
    expr: string,
    table: 'coffees' | 'comments',
  ): Promise<Array<{ label: string; count: number }>> {
    const { results } = await this.db
      .prepare(
        `SELECT ${expr} AS label, COUNT(*) AS count FROM ${table} GROUP BY label ORDER BY count DESC, label ASC`,
      )
      .all<{ label: string | number; count: number }>()
    return results.map((r) => ({ label: String(r.label), count: r.count }))
  }

  /* ------------------------------- users ------------------------------- */

  async getUserByUsername(username: string): Promise<UserRow | null> {
    return this.db
      .prepare('SELECT * FROM users WHERE username = ?')
      .bind(username)
      .first<UserRow>()
  }

  async getUserById(id: string): Promise<User | null> {
    const row = await this.db
      .prepare('SELECT * FROM users WHERE id = ?')
      .bind(id)
      .first<UserRow>()
    return row ? rowToUser(row) : null
  }

  async createUser(user: {
    id: string
    username: string
    displayName: string
    passwordHash: string
    role: 'admin' | 'publisher' | 'user'
  }): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO users (id, username, display_name, password_hash, role)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .bind(user.id, user.username, user.displayName, user.passwordHash, user.role)
      .run()
  }

  async listUsers(): Promise<User[]> {
    const { results } = await this.db
      .prepare('SELECT * FROM users ORDER BY created_at ASC')
      .all<UserRow>()
    return results.map(rowToUser)
  }

  async updateUser(
    id: string,
    updates: { username?: string; passwordHash?: string; role?: string },
  ): Promise<void> {
    const sets: string[] = []
    const binds: unknown[] = []
    if (updates.username) {
      sets.push('username = ?')
      binds.push(updates.username)
    }
    if (updates.passwordHash) {
      sets.push('password_hash = ?')
      binds.push(updates.passwordHash)
    }
    if (updates.role) {
      sets.push('role = ?')
      binds.push(updates.role)
    }
    if (sets.length === 0) return
    binds.push(id)
    await this.db
      .prepare(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`)
      .bind(...binds)
      .run()
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await this.db
      .prepare('DELETE FROM users WHERE id = ?')
      .bind(id)
      .run()
    return (result.meta.changes ?? 0) > 0
  }

  /* ------------------------------- diary ------------------------------- */

  async listDiaryEntries(): Promise<DiaryEntry[]> {
    const { results } = await this.db
      .prepare('SELECT * FROM diary ORDER BY created_at DESC')
      .all<DiaryRow>()
    return results.map(rowToDiary)
  }

  async getDiaryEntry(id: string): Promise<DiaryEntry | null> {
    const row = await this.db
      .prepare('SELECT * FROM diary WHERE id = ?')
      .bind(id)
      .first<DiaryRow>()
    return row ? rowToDiary(row) : null
  }

  async createDiaryEntry(entry: DiaryEntry): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO diary (id, title, content, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .bind(entry.id, entry.title, entry.content, entry.createdAt, entry.updatedAt)
      .run()
  }

  async updateDiaryEntry(id: string, entry: DiaryEntry): Promise<void> {
    await this.db
      .prepare(
        `UPDATE diary SET title=?, content=?, updated_at=? WHERE id=?`,
      )
      .bind(entry.title, entry.content, entry.updatedAt, id)
      .run()
  }

  async deleteDiaryEntry(id: string): Promise<boolean> {
    const result = await this.db
      .prepare('DELETE FROM diary WHERE id = ?')
      .bind(id)
      .run()
    return (result.meta.changes ?? 0) > 0
  }

  /* ----------------------------- brew card ----------------------------- */

  async getBrewCard(): Promise<BrewCard | null> {
    const row = await this.db
      .prepare('SELECT * FROM brew_card WHERE id = ?')
      .bind(BREW_CARD_ID)
      .first<BrewCardRow>()
    return row ? rowToBrewCard(row) : null
  }

  async saveBrewCard(card: BrewCard): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO brew_card (
           id, bean_name, dose, water, ratio, temperature, grind_size,
           bloom_time, bloom_water, stage1_water, stage2_water, stage3_water,
           image_url, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           bean_name    = excluded.bean_name,
           dose         = excluded.dose,
           water        = excluded.water,
           ratio        = excluded.ratio,
           temperature  = excluded.temperature,
           grind_size   = excluded.grind_size,
           bloom_time   = excluded.bloom_time,
           bloom_water  = excluded.bloom_water,
           stage1_water = excluded.stage1_water,
           stage2_water = excluded.stage2_water,
           stage3_water = excluded.stage3_water,
           image_url    = excluded.image_url,
           updated_at   = excluded.updated_at`,
      )
      .bind(
        BREW_CARD_ID,
        card.beanName,
        card.dose ?? '',
        card.water ?? '',
        card.ratio ?? '',
        card.temperature ?? '',
        card.grindSize ?? '',
        card.bloomTime ?? '',
        card.bloomWater ?? '',
        card.stage1Water ?? '',
        card.stage2Water ?? '',
        card.stage3Water ?? '',
        card.imageUrl ?? null,
        card.updatedAt,
      )
      .run()
  }
}
