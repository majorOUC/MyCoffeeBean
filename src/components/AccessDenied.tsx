import { Link } from 'react-router-dom'

import { useAuth } from '@/components/AuthContext'

/**
 * 受限页面的统一守卫提示：
 * - 未登录：说明 + 「去登录」入口（登录后可回到当前页）
 * - 已登录但权限不够：权限不足 + 可选返回按钮
 */
export default function AccessDenied({
  message,
  backTo,
  backLabel,
}: {
  /** 权限说明，如"只有管理员才能访问咖啡日记" */
  message: string
  /** 已登录但权限不足时的返回链接（未登录时不显示） */
  backTo?: string
  backLabel?: string
}) {
  const { user } = useAuth()

  if (!user) {
    return (
      <div className="py-16 text-center">
        <h1 className="mb-4 font-display text-2xl font-bold text-coffee-900">
          请先登录
        </h1>
        <p className="mb-6 text-ink-400">{message}</p>
        <Link
          to="/login"
          className="rounded-full bg-coffee-700 px-6 py-2.5 text-sm font-medium text-cream-50 transition-colors hover:bg-coffee-800"
        >
          去登录
        </Link>
      </div>
    )
  }

  return (
    <div className="py-16 text-center">
      <h1 className="mb-4 font-display text-2xl font-bold text-coffee-900">
        权限不足
      </h1>
      <p className="mb-6 text-ink-400">{message}</p>
      {backTo && (
        <Link
          to={backTo}
          className="rounded-full bg-coffee-700 px-6 py-2.5 text-sm font-medium text-cream-50 transition-colors hover:bg-coffee-800"
        >
          {backLabel ?? '返回'}
        </Link>
      )}
    </div>
  )
}
