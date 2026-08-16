import type { Coffee, Tasting } from '../../src/types/coffee'

/** Worker 绑定资源 */
export interface Env {
  DB: D1Database
  IMAGES: R2Bucket
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

/** D1 中 tastings 表的行结构 */
interface TastingRow {
  id: string
  coffee_id: string
  date: string
  brew_method: string
  dose: number | null
  water: number | null
  temperature: number | null
  grind_size: string | null
  brew_time: string | null
  rating: number
  notes: string | null
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

function rowToTasting(row: TastingRow): Tasting {
  return {
    id: row.id,
    coffeeId: row.coffee_id,
    date: row.date,
    brewMethod: row.brew_method as Tasting['brewMethod'],
    dose: row.dose ?? undefined,
    water: row.water ?? undefined,
    temperature: row.temperature ?? undefined,
    grindSize: row.grind_size ?? undefined,
    brewTime: row.brew_time ?? undefined,
    rating: row.rating,
    notes: row.notes ?? undefined,
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

  async listTastings(coffeeId: string): Promise<Tasting[]> {
    const { results } = await this.db
      .prepare('SELECT * FROM tastings WHERE coffee_id = ? ORDER BY date DESC')
      .bind(coffeeId)
      .all<TastingRow>()
    return results.map(rowToTasting)
  }

  async createTasting(tasting: Tasting): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO tastings (id, coffee_id, date, brew_method, dose, water, temperature, grind_size, brew_time, rating, notes, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        tasting.id,
        tasting.coffeeId,
        tasting.date,
        tasting.brewMethod,
        tasting.dose ?? null,
        tasting.water ?? null,
        tasting.temperature ?? null,
        tasting.grindSize ?? null,
        tasting.brewTime ?? null,
        tasting.rating,
        tasting.notes ?? null,
        new Date().toISOString(),
      )
      .run()
  }

  async listRecentTastings(limit: number): Promise<Tasting[]> {
    const { results } = await this.db
      .prepare('SELECT * FROM tastings ORDER BY date DESC LIMIT ?')
      .bind(limit)
      .all<TastingRow>()
    return results.map(rowToTasting)
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

    const tastings = await this.db
      .prepare('SELECT COUNT(*) AS n FROM tastings')
      .first<{ n: number }>()

    return {
      totalCoffees: overview?.totalCoffees ?? 0,
      totalCountries: overview?.totalCountries ?? 0,
      totalRegions: overview?.totalRegions ?? 0,
      totalProcesses: overview?.totalProcesses ?? 0,
      totalTastings: tastings?.n ?? 0,
      averageRating: overview?.averageRating ?? 0,
    }
  }
}
