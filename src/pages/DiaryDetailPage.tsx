import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { useAuth } from '@/components/AuthContext'
import AccessDenied from '@/components/AccessDenied'
import ErrorState from '@/components/ErrorState'
import { useToast } from '@/components/toastContext'
import { coffeeService } from '@/services/coffeeService'
import type { DiaryEntry } from '@/types/coffee'
import { formatDate } from '@/utils/format'

export default function DiaryDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const toast = useToast()
  const [entry, setEntry] = useState<DiaryEntry | null | undefined>(undefined)

  useEffect(() => {
    if (!id || !user || user.role !== 'admin') return
    coffeeService
      .getDiaryEntry(id)
      .then((e) => setEntry(e ?? null))
      .catch(() => setEntry(null))
  }, [id, user])

  if (!user || user.role !== 'admin') {
    return <AccessDenied message="只有管理员才能访问咖啡日记。" />
  }

  if (entry === undefined) {
    return (
      <div className="py-16">
        <div className="h-64 animate-pulse rounded-3xl bg-coffee-100/60" />
      </div>
    )
  }

  if (entry === null) {
    return (
      <div className="py-16">
        <ErrorState
          title="找不到日记"
          description="该日记可能已被删除。"
          onRetry={() => navigate('/diary')}
        />
      </div>
    )
  }

  const handleDelete = async () => {
    if (!window.confirm('确定删除这篇日记？')) return
    try {
      await coffeeService.deleteDiaryEntry(entry.id)
      toast.show('日记已删除', 'success')
      navigate('/diary')
    } catch {
      toast.show('删除失败，请重试', 'error')
    }
  }

  return (
    <div className="py-8">
      <Link
        to="/diary"
        className="text-sm text-ink-400 transition-colors hover:text-coffee-700"
      >
        ← 返回日记列表
      </Link>

      <article className="mt-6">
        <header className="mb-6">
          <h1 className="font-display text-3xl font-bold text-coffee-900">
            {entry.title}
          </h1>
          <p className="mt-2 text-sm text-ink-400">
            {formatDate(entry.createdAt)}
            {entry.updatedAt !== entry.createdAt && (
              <span> · 更新于 {formatDate(entry.updatedAt)}</span>
            )}
          </p>
        </header>

        <div className="prose prose-coffee max-w-none">
          <div className="whitespace-pre-wrap text-ink-700 leading-relaxed">
            {entry.content}
          </div>
        </div>

        <div className="mt-8 flex gap-3 border-t border-coffee-200/60 pt-6">
          <Link
            to={`/diary/${entry.id}/edit`}
            className="rounded-full border border-coffee-300 px-5 py-2 text-sm text-coffee-700 transition-colors hover:bg-coffee-100"
          >
            编辑
          </Link>
          <button
            type="button"
            onClick={() => void handleDelete()}
            className="rounded-full border border-red-200 px-5 py-2 text-sm text-red-600 transition-colors hover:bg-red-50"
          >
            删除
          </button>
        </div>
      </article>
    </div>
  )
}
