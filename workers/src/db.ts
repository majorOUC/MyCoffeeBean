import type { Coffee, Comment } from '../../src/types/coffee'

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
  created_at: string
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
    createdAt: row.created_at,
  }
}

export interface ListParams {
  search?: string
  country?: string
  process?: string
  roastLevel?: string
  sort?: 'rating' | 'recent' | 'name'
}

const SORT_SQL: Record<string, string> = {
  rating: 'rating DESC',
  name: 'name COLLATE NOCASE ASC',
  recent: 'datetime(created_at) DESC',
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
        `INSERT INTO coffees (id, name, roaster, country, region, farm, variety, process, altitude, roast_level, flavor_notes, rating, description, image_url, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        `UPDATE coffees SET name=?, roaster=?, country=?, region=?, farm=?, variety=?, process=?, altitude=?, roast_level=?, flavor_notes=?, rating=?, description=?, image_url=?, updated_at=? WHERE id=?`,
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
        `INSERT INTO comments (id, coffee_id, content, author, created_at)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .bind(
        comment.id,
        comment.coffeeId,
        comment.content,
        comment.author,
        comment.createdAt,
      )
      .run()
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
}
