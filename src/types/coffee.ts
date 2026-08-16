/** 处理法 */
export type Process =
  'Washed' | 'Natural' | 'Honey' | 'Anaerobic' | 'Wet-Hulled' | 'Decaf'

/** 烘焙度 */
export type RoastLevel = 'Light' | 'Medium' | 'Medium-Dark' | 'Dark'

/** 冲煮方式 */
export type BrewMethod =
  | 'V60'
  | 'Aeropress'
  | 'Espresso'
  | 'Cold Brew'
  | 'French Press'
  | 'Chemex'
  | 'Moka Pot'

/** 一款咖啡豆 */
export interface Coffee {
  id: string
  name: string
  roaster: string
  country: string
  region: string
  farm?: string
  variety?: string
  process: Process
  /** 海拔（米） */
  altitude?: number
  roastLevel: RoastLevel
  /** 风味标签，如 Floral / Citrus / Berry */
  flavorNotes: string[]
  /** 我的评分，0.5 步进，范围 0–5 */
  rating: number
  /** 我的笔记 */
  description?: string
  /** 包装照片 URL（Phase 4 起指向 R2） */
  imageUrl?: string
  createdAt: string
  updatedAt: string
}

/** 新增/编辑咖啡豆时的输入 */
export type CoffeeInput = Omit<Coffee, 'id' | 'createdAt' | 'updatedAt'>

/** 一次冲煮记录，与 Coffee 一对多 */
export interface Tasting {
  id: string
  coffeeId: string
  date: string
  brewMethod: BrewMethod
  /** 粉量（g） */
  dose?: number
  /** 水量（g / ml） */
  water?: number
  /** 水温（°C） */
  temperature?: number
  grindSize?: string
  /** 萃取时间，如 "2:30" */
  brewTime?: string
  rating: number
  notes?: string
}

/** 新增冲煮记录时的输入 */
export type TastingInput = Omit<Tasting, 'id' | 'coffeeId'>

/** 列表筛选与排序参数 */
export interface CoffeeQuery {
  search?: string
  country?: string
  process?: string
  roastLevel?: string
  sort?: 'rating' | 'recent' | 'name'
}

/** 单个分布项 */
export interface Distribution {
  label: string
  count: number
}

/** 汇总统计 */
export interface AtlasStats {
  totalCoffees: number
  totalCountries: number
  totalRegions: number
  totalProcesses: number
  totalTastings: number
  averageRating: number
  /** 国家分布（按豆数降序） */
  countryDist: Distribution[]
  /** 处理法分布 */
  processDist: Distribution[]
  /** 烘焙度分布 */
  roastDist: Distribution[]
  /** 评分分布（label 为 "4.5" 等） */
  ratingDist: Distribution[]
  /** 月度饮用数量（label 为 "2026-08"） */
  monthlyTastings: Distribution[]
}
