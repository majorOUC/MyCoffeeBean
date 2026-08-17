import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { useAuth } from '@/components/AuthContext'
import { useToast } from '@/components/toastContext'
import { coffeeService } from '@/services/coffeeService'
import type { DiaryInput } from '@/types/coffee'

export default function DiaryFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const navigate = useNavigate()
  const { user } = useAuth()
  const toast = useToast()

  const [form, setForm] = useState<DiaryInput>({ title: '', content: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!id || !user || user.role !== 'admin') return
    coffeeService.getDiaryEntry(id).then((entry) => {
      if (entry) {
        setForm({ title: entry.title, content: entry.content })
      }
    })
  }, [id, user])

  if (!user || user.role !== 'admin') {
    return (
      <div className="py-16 text-center">
        <h1 className="mb-4 font-display text-2xl font-bold text-coffee-900">
          权限不足
        </h1>
        <p className="mb-6 text-ink-400">只有管理员才能写咖啡日记。</p>
        <Link
          to="/diary"
          className="rounded-full bg-coffee-700 px-6 py-2.5 text-sm font-medium text-cream-50 transition-colors hover:bg-coffee-800"
        >
          返回日记列表
        </Link>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !form.content.trim()) {
      toast.show('标题和内容不能为空', 'error')
      return
    }
    setSaving(true)
    try {
      if (isEdit) {
        await coffeeService.updateDiaryEntry(id, form)
        toast.show('日记已更新', 'success')
      } else {
        await coffeeService.addDiaryEntry(form)
        toast.show('日记已发布', 'success')
      }
      navigate('/diary')
    } catch {
      toast.show('保存失败，请重试', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl py-8">
      <h1 className="font-display text-3xl font-bold text-coffee-900">
        {isEdit ? '编辑日记' : '写日记'}
      </h1>
      <p className="mt-1 text-sm text-ink-400">
        {isEdit ? '修改日记内容' : '记录你的咖啡生活'}
      </p>

      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="mt-8 space-y-6"
      >
        <div className="rounded-3xl border border-coffee-200/70 bg-cream-50 p-5 shadow-sm sm:p-6">
          <label className="mb-1.5 block text-xs font-medium tracking-wide text-ink-500">
            标题 *
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) =>
              setForm((f) => ({ ...f, title: e.target.value }))
            }
            className="w-full rounded-xl border border-coffee-300/70 bg-cream-50 px-3.5 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-coffee-500 focus:ring-2 focus:ring-coffee-300/40 focus:outline-none"
            placeholder="给日记起个标题"
            required
          />
        </div>

        <div className="rounded-3xl border border-coffee-200/70 bg-cream-50 p-5 shadow-sm sm:p-6">
          <label className="mb-1.5 block text-xs font-medium tracking-wide text-ink-500">
            内容 *
          </label>
          <textarea
            value={form.content}
            onChange={(e) =>
              setForm((f) => ({ ...f, content: e.target.value }))
            }
            className="w-full rounded-xl border border-coffee-300/70 bg-cream-50 px-3.5 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-coffee-500 focus:ring-2 focus:ring-coffee-300/40 focus:outline-none min-h-64 resize-y"
            placeholder="写下你的咖啡心得..."
            required
          />
        </div>

        <div className="flex justify-end gap-3 border-t border-coffee-200/60 pt-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-full px-5 py-2.5 text-sm text-ink-500 hover:text-coffee-700"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-coffee-700 px-6 py-2.5 text-sm font-medium text-cream-50 shadow-sm transition-all hover:bg-coffee-800 hover:shadow-md disabled:opacity-50"
          >
            {saving ? '保存中...' : isEdit ? '保存修改' : '发布日记'}
          </button>
        </div>
      </form>
    </div>
  )
}
