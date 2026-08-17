import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import Avatar from '@/components/Avatar'
import { useAuth } from '@/components/AuthContext'
import CoffeeCover from '@/components/CoffeeCover'
import EmptyState from '@/components/EmptyState'
import ErrorState from '@/components/ErrorState'
import RatingStars from '@/components/RatingStars'
import Tag from '@/components/Tag'
import { useToast } from '@/components/toastContext'
import { PROCESS_LABEL, ROAST_LABEL } from '@/data/constants'
import { coffeeService } from '@/services/coffeeService'
import type { Coffee, Comment, CommentInput } from '@/types/coffee'
import { countryFlag, formatDate, formatAltitude, timeAgo } from '@/utils/format'

export default function CoffeeDetailPage() {
  const { id } = useParams<{ id: string }>()
  // key 让 id 变化时整组件重挂载，避免复用旧数据闪屏
  return <CoffeeDetail key={id ?? ''} id={id ?? ''} />
}

function CoffeeDetail({ id }: { id: string }) {
  const navigate = useNavigate()
  const toast = useToast()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [coffee, setCoffee] = useState<Coffee | null | undefined>(undefined)
  const [comments, setComments] = useState<Comment[]>([])
  const [loadError, setLoadError] = useState(false)
  const [commentForm, setCommentForm] = useState<CommentInput>({
    content: '',
    author: user?.username ?? '',
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!id) return
    Promise.all([
      coffeeService.getCoffee(id),
      coffeeService.listComments(id),
    ]).then(
      ([c, cs]) => {
        setCoffee(c ?? null)
        setComments(cs)
      },
      () => setLoadError(true),
    )
  }, [id])

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentForm.content.trim()) {
      toast.show('请输入评论内容', 'error')
      return
    }
    setSubmitting(true)
    try {
      const comment = await coffeeService.addComment(id!, commentForm)
      setComments((prev) => [comment, ...prev])
      setCommentForm((f) => ({ ...f, content: '' }))
      toast.show('评论已发布', 'success')
    } catch {
      toast.show('评论发布失败，请重试', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('确定删除这条评论？')) return
    try {
      await coffeeService.deleteComment(commentId)
      setComments((prev) => prev.filter((c) => c.id !== commentId))
      toast.show('评论已删除', 'success')
    } catch {
      toast.show('删除失败，请重试', 'error')
    }
  }

  if (loadError) {
    return (
      <div className="py-16">
        <ErrorState onRetry={() => navigate(0)} />
      </div>
    )
  }

  if (coffee === undefined) {
    return (
      <div className="py-16">
        <div className="h-72 animate-pulse rounded-3xl bg-coffee-100/60" />
      </div>
    )
  }

  if (coffee === null) {
    return (
      <div className="py-16">
        <EmptyState
          emoji="🫥"
          title="找不到这款咖啡豆"
          description="它可能已被删除，或者链接有误。"
        />
        <div className="mt-6 text-center">
          <Link
            to="/coffees"
            className="text-sm text-coffee-700 hover:underline"
          >
            ← 返回图鉴
          </Link>
        </div>
      </div>
    )
  }

  const handleDelete = async () => {
    if (!window.confirm(`确定删除「${coffee.name}」及其全部评论？`)) return
    try {
      await coffeeService.deleteCoffee(coffee.id)
      toast.show(`已删除「${coffee.name}」`, 'success')
      navigate('/coffees')
    } catch {
      toast.show('删除失败，请重试', 'error')
    }
  }

  return (
    <div className="py-8">
      <Link
        to="/coffees"
        className="text-sm text-ink-400 transition-colors hover:text-coffee-700"
      >
        ← 返回图鉴
      </Link>

      {/* 档案头部 */}
      <div className="mt-4 flex flex-col gap-6 sm:flex-row">
        <div className="h-56 w-full shrink-0 overflow-hidden rounded-3xl shadow-md sm:h-64 sm:w-72">
          <CoffeeCover coffee={coffee} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="font-display text-3xl font-bold text-coffee-900">
                {coffee.name}
              </h1>
              <p className="mt-1 text-ink-400">{coffee.roaster}</p>
            </div>
            <div className="flex gap-2">
              {isAdmin && (
                <>
                  <Link
                    to={`/add?id=${coffee.id}`}
                    className="rounded-full border border-coffee-300 px-4 py-1.5 text-sm text-coffee-700 transition-colors hover:bg-coffee-100"
                  >
                    编辑
                  </Link>
                  <button
                    type="button"
                    onClick={() => void handleDelete()}
                    className="rounded-full border border-red-200 px-4 py-1.5 text-sm text-red-600 transition-colors hover:bg-red-50"
                  >
                    删除
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <RatingStars value={coffee.rating} size="lg" />
            <span className="font-display text-2xl font-semibold text-coffee-800">
              {coffee.rating.toFixed(1)}
            </span>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
            <Field
              label="国家"
              value={`${countryFlag(coffee.country)} ${coffee.country}`}
            />
            <Field label="产区" value={coffee.region} />
            <Field label="庄园" value={coffee.farm} />
            <Field label="品种" value={coffee.variety} />
            <Field label="处理法" value={PROCESS_LABEL[coffee.process]} />
            <Field label="海拔" value={formatAltitude(coffee.altitude)} />
            <Field label="烘焙度" value={ROAST_LABEL[coffee.roastLevel]} />
            <Field
              label="克价"
              value={coffee.pricePerGram ? `¥${coffee.pricePerGram.toFixed(2)}/g` : undefined}
            />
            <Field label="收录于" value={formatDate(coffee.createdAt)} />
          </div>
        </div>
      </div>

      {/* 风味 */}
      <section className="mt-10">
        <h2 className="mb-3 font-display text-lg font-semibold text-coffee-800">
          风味图谱
        </h2>
        <div className="flex flex-wrap gap-2">
          {coffee.flavorNotes.length > 0 ? (
            coffee.flavorNotes.map((note) => (
              <Tag key={note} tone="leaf">
                {note}
              </Tag>
            ))
          ) : (
            <span className="text-sm text-ink-400">尚未记录风味</span>
          )}
        </div>
      </section>

      {/* 我的笔记 */}
      {coffee.description && (
        <section className="mt-8">
          <h2 className="mb-3 font-display text-lg font-semibold text-coffee-800">
            我的笔记
          </h2>
          <blockquote className="rounded-2xl border-l-4 border-coffee-400 bg-cream-50 p-5 text-ink-700 italic shadow-sm">
            {coffee.description}
          </blockquote>
        </section>
      )}

      {/* 评论区 */}
      <section className="mt-10">
        <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-coffee-800">
          评论
          <span className="rounded-full bg-coffee-100 px-2 py-0.5 text-xs font-medium text-coffee-600">
            {comments.length}
          </span>
        </h2>

        {/* 发表评论表单 */}
        {user ? (
          <form
            onSubmit={(e) => void handleSubmitComment(e)}
            className="mb-6 rounded-2xl border border-coffee-200/70 bg-cream-50 p-5 shadow-sm"
          >
            <div className="mb-3 flex items-center gap-2">
              <Avatar username={user.username} size="md" />
              <span className="font-medium text-coffee-900">{user.username}</span>
            </div>
            <div className="mb-3">
              <textarea
                value={commentForm.content}
                onChange={(e) => setCommentForm((f) => ({ ...f, content: e.target.value }))}
                className="w-full rounded-xl border border-coffee-300/70 bg-cream-50 px-3.5 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-coffee-500 focus:ring-2 focus:ring-coffee-300/40 focus:outline-none min-h-24 resize-y"
                placeholder="分享你对这款豆子的看法..."
                required
              />
            </div>
            <button type="submit" disabled={submitting || !commentForm.content.trim()} className="rounded-full bg-coffee-700 px-5 py-2 text-sm font-medium text-cream-50 shadow-sm transition-all hover:bg-coffee-800 hover:shadow-md disabled:opacity-50">
              {submitting ? '发布中...' : '发布评论'}
            </button>
          </form>
        ) : (
          <div className="mb-6 rounded-2xl border border-dashed border-coffee-300/70 bg-cream-50/50 p-5 text-center">
            <p className="text-sm text-ink-400">
              <Link to="/login" className="text-coffee-700 hover:underline">登录</Link> 后才能发表评论
            </p>
          </div>
        )}

        {comments.length === 0 ? (
          <EmptyState emoji="💬" title="还没有评论" description="成为第一个评论这款豆子的人吧。" />
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => {
              const canDelete = user && (user.role === 'admin' || comment.userId === user.id)
              return (
                <div key={comment.id} className="rounded-2xl border border-coffee-200/70 bg-cream-50 p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar username={comment.author} size="md" />
                      <span className="font-medium text-coffee-900">{comment.author}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-ink-400">{timeAgo(comment.createdAt)}</span>
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => void handleDeleteComment(comment.id)}
                          className="rounded-full px-2 py-1 text-xs text-ink-400 transition-colors hover:bg-red-50 hover:text-red-500"
                          title="删除评论"
                        >
                          删除
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-ink-700">{comment.content}</p>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <dt className="text-xs tracking-wide text-ink-400">{label}</dt>
      <dd className="mt-0.5 font-medium text-ink-900">{value || '—'}</dd>
    </div>
  )
}
