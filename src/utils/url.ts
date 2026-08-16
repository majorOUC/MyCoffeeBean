import { API_BASE_URL } from '@/services/httpCoffeeService'

/**
 * imageUrl 可能是：
 * - 完整 URL / dataURL（Mock 模式）→ 原样返回
 * - API 相对路径（/api/images/xxx，真实模式）→ 拼 API 基础地址
 */
export function resolveImageUrl(url?: string): string | undefined {
  if (!url) return undefined
  if (/^(https?:|data:|blob:)/.test(url)) return url
  return `${API_BASE_URL}${url}`
}
