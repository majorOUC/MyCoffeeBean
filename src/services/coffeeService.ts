import { seedCoffees, seedTastings } from '@/data/mockData'
import type {
  AtlasStats,
  Coffee,
  CoffeeInput,
  CoffeeQuery,
  Tasting,
  TastingInput,
} from '@/types/coffee'
import { randomId } from '@/utils/format'

const STORAGE_KEY = 'coffee-atlas:data:v1'

interface Store {
  coffees: Coffee[]
  tastings: Tasting[]
}

function load(): Store {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as Store
  } catch {
    // 忽略损坏数据，回退到种子
  }
  return { coffees: seedCoffees, tastings: seedTastings }
}

function save(store: Store): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {
    // localStorage 满了（例如图片过大）时静默降级为内存模式
  }
}

function matches(coffee: Coffee, query: CoffeeQuery): boolean {
  const { search, country, process, roastLevel } = query
  if (country && coffee.country !== country) return false
  if (process && coffee.process !== process) return false
  if (roastLevel && coffee.roastLevel !== roastLevel) return false
  if (search) {
    const haystack = [
      coffee.name,
      coffee.roaster,
      coffee.country,
      coffee.region,
      coffee.farm ?? '',
      coffee.variety ?? '',
      ...coffee.flavorNotes,
    ]
      .join(' ')
      .toLowerCase()
    if (!haystack.includes(search.toLowerCase())) return false
  }
  return true
}

/**
 * Mock 实现：内存 + localStorage 持久化。
 * 与未来的 HttpCoffeeService 实现同一接口，页面代码不感知差别。
 */
class MockCoffeeService {
  private store: Store = load()

  private persist(): void {
    save(this.store)
  }

  async listCoffees(query: CoffeeQuery = {}): Promise<Coffee[]> {
    const list = this.store.coffees.filter((c) => matches(c, query))
    switch (query.sort) {
      case 'rating':
        return [...list].sort((a, b) => b.rating - a.rating)
      case 'name':
        return [...list].sort((a, b) => a.name.localeCompare(b.name))
      case 'recent':
      default:
        return [...list].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
    }
  }

  async getCoffee(id: string): Promise<Coffee | undefined> {
    return this.store.coffees.find((c) => c.id === id)
  }

  async addCoffee(input: CoffeeInput): Promise<Coffee> {
    const now = new Date().toISOString()
    const coffee: Coffee = {
      ...input,
      id: randomId(),
      createdAt: now,
      updatedAt: now,
    }
    this.store.coffees.push(coffee)
    this.persist()
    return coffee
  }

  async updateCoffee(
    id: string,
    input: CoffeeInput,
  ): Promise<Coffee | undefined> {
    const idx = this.store.coffees.findIndex((c) => c.id === id)
    if (idx === -1) return undefined
    const updated: Coffee = {
      ...this.store.coffees[idx],
      ...input,
      updatedAt: new Date().toISOString(),
    }
    this.store.coffees[idx] = updated
    this.persist()
    return updated
  }

  async deleteCoffee(id: string): Promise<boolean> {
    const before = this.store.coffees.length
    this.store.coffees = this.store.coffees.filter((c) => c.id !== id)
    this.store.tastings = this.store.tastings.filter((t) => t.coffeeId !== id)
    this.persist()
    return this.store.coffees.length < before
  }

  async listTastings(coffeeId: string): Promise<Tasting[]> {
    return this.store.tastings
      .filter((t) => t.coffeeId === coffeeId)
      .sort((a, b) => (a.date < b.date ? 1 : -1))
  }

  async addTasting(coffeeId: string, input: TastingInput): Promise<Tasting> {
    const tasting: Tasting = { ...input, coffeeId, id: randomId() }
    this.store.tastings.push(tasting)
    this.persist()
    return tasting
  }

  async listRecentTastings(limit = 5): Promise<Tasting[]> {
    return [...this.store.tastings]
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .slice(0, limit)
  }

  async getStats(): Promise<AtlasStats> {
    const { coffees, tastings } = this.store
    const rated = coffees.filter((c) => c.rating > 0)
    return {
      totalCoffees: coffees.length,
      totalCountries: new Set(coffees.map((c) => c.country)).size,
      totalRegions: new Set(coffees.map((c) => c.region)).size,
      totalProcesses: new Set(coffees.map((c) => c.process)).size,
      totalTastings: tastings.length,
      averageRating: rated.length
        ? Math.round(
            (rated.reduce((sum, c) => sum + c.rating, 0) / rated.length) * 10,
          ) / 10
        : 0,
    }
  }
}

export const coffeeService = new MockCoffeeService()
