/**
 * 根据用户名生成确定性的头像颜色
 * 同一个用户名每次都会生成相同的颜色
 */
export function generateAvatarColor(username: string): string {
  // 简单的哈希函数，将用户名转成数字
  let hash = 0
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash)
  }

  // 生成 HSL 颜色，保持适中的饱和度和亮度
  const hue = Math.abs(hash) % 360
  const saturation = 45 + (Math.abs(hash >> 8) % 20) // 45-65%
  const lightness = 35 + (Math.abs(hash >> 16) % 15) // 35-50%

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`
}

/**
 * 获取用户名的显示首字母
 * - 中文用户名：取前两个字
 * - 英文用户名：取首字母（大写）
 * - 数字用户名：取前两位
 */
export function getAvatarInitials(username: string): string {
  if (!username) return '?'

  // 如果是纯数字，取前两位
  if (/^\d+$/.test(username)) {
    return username.slice(0, 2)
  }

  // 如果包含中文，取前两个字
  const chineseMatch = username.match(/[\u4e00-\u9fa5]/g)
  if (chineseMatch && chineseMatch.length >= 2) {
    return chineseMatch.slice(0, 2).join('')
  }
  if (chineseMatch && chineseMatch.length === 1) {
    return chineseMatch[0]
  }

  // 英文：取首字母大写
  return username.charAt(0).toUpperCase()
}
