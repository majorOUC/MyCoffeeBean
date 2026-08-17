/** 处理法 */
export type Process =
  'Washed' | 'Natural' | 'Honey' | 'Anaerobic' | 'Wet-Hulled' | 'Decaf'

/** 烘焙度 */
export type RoastLevel = 'Light' | 'Medium' | 'Medium-Dark' | 'Dark'

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
  /** 风味标签，如花香 / 柑橘 / 莓果 */
  flavorNotes: string[]
  /** 我的评分，0.5 步进，范围 0–5 */
  rating: number
  /** 我的笔记 */
  description?: string
  /** 包装照片 URL（指向 R2） */
  imageUrl?: string
  createdAt: string
  updatedAt: string
}

/** 新增/编辑咖啡豆时的输入 */
export type CoffeeInput = Omit<Coffee, 'id' | 'createdAt' | 'updatedAt'>

/** 一条评论 */
export interface Comment {
  id: string
  coffeeId: string
  /** 评论内容 */
  content: string
  /** 作者名（可选） */
  author: string
  createdAt: string
}

/** 新增评论时的输入 */
export type CommentInput = Pick<Comment, 'content' | 'author'>

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
  totalComments: number
  averageRating: number
  /** 国家分布（按豆数降序） */
  countryDist: Distribution[]
  /** 处理法分布 */
  processDist: Distribution[]
  /** 烘焙度分布 */
  roastDist: Distribution[]
  /** 评分分布（label 为 "4.5" 等） */
  ratingDist: Distribution[]
  /** 月度评论数量（label 为 "2026-08"） */
  monthlyComments: Distribution[]
}
