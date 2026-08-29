import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import AccessDenied from '@/components/AccessDenied'
import { useAuth } from '@/components/AuthContext'
import Avatar from '@/components/Avatar'
import { useToast } from '@/components/toastContext'

const inputClass =
  'w-full rounded-xl border border-coffee-300/70 bg-cream-50 px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:border-coffee-500 focus:ring-2 focus:ring-coffee-300/40 focus:outline-none'

export default function ProfilePage() {
  const navigate = useNavigate()
  const { user, updateProfile } = useAuth()
  const toast = useToast()
  const [displayName, setDisplayName] = useState(user?.displayName ?? '')
  const [saving, setSaving] = useState(false)

  if (!user) {
    return (
      <AccessDenied message="登录后可以修改你的昵称等个人信息。" />
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!displayName.trim()) {
      toast.show('昵称不能为空', 'error')
      return
    }
    setSaving(true)
    try {
      await updateProfile(displayName.trim())
      toast.show('昵称已更新', 'success')
      navigate('/')
    } catch (err) {
      toast.show(err instanceof Error ? err.message : '保存失败', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-md py-8">
      <h1 className="font-display text-3xl font-bold text-coffee-900">
        个人设置
      </h1>
      <p className="mt-1 text-sm text-ink-400">修改你的显示昵称</p>

      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="mt-8 rounded-3xl border border-coffee-200/70 bg-cream-50 p-5 shadow-sm sm:p-6"
      >
        <div className="mb-5 flex items-center gap-3">
          <Avatar username={displayName || user.username} size="md" />
          <div className="min-w-0">
            <div className="truncate font-medium text-coffee-900">
              {user.username}
            </div>
            <div className="text-xs text-ink-400">
              {user.role === 'admin'
                ? '管理员'
                : user.role === 'publisher'
                  ? '发布者'
                  : '普通用户'}
            </div>
          </div>
        </div>

        <label className="mb-1.5 block text-xs font-medium tracking-wide text-ink-500">
          昵称（登录账号不可修改）
        </label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={20}
          className={inputClass}
          placeholder="你的显示名称，可以是中文"
        />

        <div className="mt-6 flex justify-end gap-3 border-t border-coffee-200/60 pt-5">
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
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </form>
    </div>
  )
}
