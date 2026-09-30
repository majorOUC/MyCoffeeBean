import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { useAuth } from '@/components/AuthContext'
import AccessDenied from '@/components/AccessDenied'
import EmptyState from '@/components/EmptyState'
import ErrorState from '@/components/ErrorState'
import { coffeeService } from '@/services/coffeeService'
import type { DiaryEntry } from '@/types/coffee'
import { formatDate } from '@/utils/format'
import { resolveImageUrl } from '@/utils/url'

export default function DiaryPage() {
  const { user } = useAuth()
  const [entries, setEntries] = useState<DiaryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!user || user.role !== 'admin') return
    coffeeService
      .listDiaryEntries()
      .then(setEntries)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [user])

  if (!user || user.role !== 'admin') {
    return <AccessDenied message="只有管理员才能访问咖啡日记。" />
  }

  if (error) {
    return (
      <div className="py-16">
        <ErrorState onRetry={() => window.location.reload()} />
      </div>
    )
  }

  return (
    <div className="py-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-coffee-900">
            咖啡日记
          </h1>
          <p className="mt-1 text-sm text-ink-400">
            共 {entries.length} 篇 · 记录你的咖啡生活
          </p>
        </div>
        <Link
          to="/diary/new"
          className="rounded-full bg-coffee-700 px-5 py-2.5 text-sm font-medium text-cream-50 shadow-sm transition-all hover:bg-coffee-800 hover:shadow-md"
        >
          写日记
        </Link>
      </header>

      <div className="mt-8">
        {loading ? (
          <div className="space-y-4 pl-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-28 animate-pulse rounded-2xl bg-coffee-100/60"
              />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <EmptyState
            emoji="📔"
            title="还没有日记"
            description="记录你的咖啡生活点滴。"
          />
        ) : (
          <div className="relative">
            {/* 时间轴主线：与节点圆点同轴（圆点直径 10px，圆心在 5px） */}
            <div
              aria-hidden
              className="absolute bottom-2 left-[5px] top-2 w-px bg-coffee-200"
            />
            <ol className="space-y-6">
              {entries.map((entry, i) => {
                const showNewMonth =
                  i === 0 ||
                  entries[i - 1].createdAt.slice(0, 7) !==
                    entry.createdAt.slice(0, 7)
                return (
                  <li key={entry.id}>
                    {showNewMonth && (
                      <p className="mb-4 pl-8 text-xs font-medium tracking-[0.2em] text-ink-400">
                        {monthLabel(entry.createdAt)}
                      </p>
                    )}
                    <div className="group relative pl-8">
                      {/* 时间轴节点：悬停卡片时放大并点亮 */}
                      <span
                        aria-hidden
                        className="absolute left-0 top-[28px] z-10 h-2.5 w-2.5 rounded-full bg-coffee-200 transition-all duration-300 ease-out group-hover:scale-150 group-hover:bg-coffee-700"
                      />
                      <Link
                        to={`/diary/${entry.id}`}
                        className="block rounded-2xl border border-coffee-200/70 bg-cream-50 p-5 shadow-sm transition-all duration-300 ease-out hover:translate-x-1.5 hover:scale-[1.02] hover:border-coffee-400 hover:shadow-lg"
                      >
                        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                          <h2 className="font-display text-lg font-semibold text-coffee-900 transition-colors group-hover:text-coffee-700">
                            {entry.title}
                          </h2>
                          <span className="shrink-0 text-xs text-ink-400">
                            {formatDate(entry.createdAt)}
                          </span>
                        </div>
                        <p className="mt-2 line-clamp-2 text-sm text-ink-500">
                          {entry.content}
                        </p>
                        {entry.images && entry.images.length > 0 && (
                          <div className="mt-3 flex items-center gap-2">
                            {entry.images.slice(0, 3).map((img, i) => (
                              <img
                                key={`${img}-${i}`}
                                src={resolveImageUrl(img)}
                                alt=""
                                loading="lazy"
                                className="h-14 w-auto rounded-xl border border-coffee-200/60"
                              />
                            ))}
                            {entry.images.length > 3 && (
                              <span className="text-xs text-ink-400">
                                +{entry.images.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </Link>
                    </div>
                  </li>
                )
              })}
            </ol>
          </div>
        )}
      </div>
    </div>
  )
}

/** ISO 日期 "2026-09-13T..." → 月份分组标题 "2026 年 9 月" */
function monthLabel(createdAt: string): string {
  const [year, month] = createdAt.split('-')
  return `${year} 年 ${Number(month)} 月`
}
