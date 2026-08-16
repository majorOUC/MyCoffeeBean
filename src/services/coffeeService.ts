import { httpCoffeeService } from '@/services/httpCoffeeService'
import { mockCoffeeService } from '@/services/mockCoffeeService'
import type { CoffeeService } from '@/services/types'

/**
 * 数据源选择：
 * - 默认走真实 API（HTTP）
 * - 设置 VITE_USE_MOCK=true 时回到 Mock（纯前端演示，无需启动 wrangler）
 */
export const coffeeService: CoffeeService =
  import.meta.env.VITE_USE_MOCK === 'true'
    ? mockCoffeeService
    : httpCoffeeService
