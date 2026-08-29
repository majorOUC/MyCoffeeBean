import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { useAuth } from '@/components/AuthContext'
import AccessDenied from '@/components/AccessDenied'
import EmptyState from '@/components/EmptyState'
import ErrorState from '@/components/ErrorState'
import { coffeeService } from '@/services/coffeeService'
import type { DiaryEntry } from '@/types/coffee'
import { formatDate } from '@/utils/format'

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
            记录你的咖啡生活
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
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-32 animate-pulse rounded-2xl bg-coffee-100/60"
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
          <div className="space-y-4">
            {entries.map((entry) => (
              <Link
                key={entry.id}
                to={`/diary/${entry.id}`}
                className="block rounded-2xl border border-coffee-200/70 bg-cream-50 p-5 shadow-sm transition-all hover:border-coffee-400 hover:shadow-md"
              >
                <h2 className="font-display text-lg font-semibold text-coffee-900">
                  {entry.title}
                </h2>
                <p className="mt-2 line-clamp-2 text-sm text-ink-500">
                  {entry.content}
                </p>
                <p className="mt-3 text-xs text-ink-400">
                  {formatDate(entry.createdAt)}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
