import { COUNTRY_COVERS, COUNTRY_FLAGS, DEFAULT_COVER } from '@/data/constants'

/** 产地国旗，未知国家返回 🏔️ */
export function countryFlag(country?: string): string {
  if (!country) return '🏔️'
  return COUNTRY_FLAGS[country] ?? '🏔️'
}

/** 产地封面渐变类名 */
export function countryCover(country?: string): string {
  if (!country) return DEFAULT_COVER
  return COUNTRY_COVERS[country] ?? DEFAULT_COVER
}

/** "1,900 m" / "—" */
export function formatAltitude(altitude?: number): string {
  return altitude ? `${altitude.toLocaleString()} m` : '—'
}

/** 生成短随机 id，Mock 阶段够用；Phase 4 起由服务端生成 */
export function randomId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

/** ISO 日期 → "2026年8月16日" */
export function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}

/** 相对时间："3 天前" / "2 个月前" */
export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86_400_000)
  if (days < 1) return '今天'
  if (days === 1) return '昨天'
  if (days < 30) return `${days} 天前`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months} 个月前`
  return `${Math.floor(months / 12)} 年前`
}

/** 评分 0–5，0.5 步进，越界值收敛到范围内 */
export function clampRating(value: number): number {
  return Math.min(5, Math.max(0, Math.round(value * 2) / 2))
}
