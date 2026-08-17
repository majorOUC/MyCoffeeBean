import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '@/components/AuthContext'
import { useToast } from '@/components/toastContext'

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [displayName, setDisplayName] = useState('')
  const [account, setAccount] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, register } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLogin) {
      if (!account.trim() || !password) {
        toast.show('请填写账号和密码', 'error')
        return
      }
    } else {
      if (!displayName.trim() || !account.trim() || !password) {
        toast.show('请填写昵称、账号和密码', 'error')
        return
      }
    }
    setLoading(true)
    try {
      if (isLogin) {
        await login(account.trim(), password)
        toast.show('登录成功', 'success')
      } else {
        await register(displayName.trim(), account.trim(), password)
        toast.show('注册成功', 'success')
      }
      navigate('/')
    } catch (err) {
      toast.show(err instanceof Error ? err.message : '操作失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center py-12">
      <div className="w-full max-w-md rounded-3xl border border-coffee-200/70 bg-cream-50 p-8 shadow-sm">
        <h1 className="mb-6 text-center font-display text-2xl font-bold text-coffee-900">
          {isLogin ? '登录' : '注册'}
        </h1>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="mb-1.5 block text-xs font-medium tracking-wide text-ink-500">
                昵称
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full rounded-xl border border-coffee-300/70 bg-cream-50 px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:border-coffee-500 focus:ring-2 focus:ring-coffee-300/40 focus:outline-none"
                placeholder="你的显示名称，可以是中文"
                autoComplete="nickname"
              />
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-medium tracking-wide text-ink-500">
              账号
            </label>
            <input
              type="text"
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              className="w-full rounded-xl border border-coffee-300/70 bg-cream-50 px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:border-coffee-500 focus:ring-2 focus:ring-coffee-300/40 focus:outline-none"
              placeholder="字母、数字或下划线，用于登录"
              autoComplete="username"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium tracking-wide text-ink-500">
              密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-coffee-300/70 bg-cream-50 px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:border-coffee-500 focus:ring-2 focus:ring-coffee-300/40 focus:outline-none"
              placeholder={isLogin ? '输入密码' : '至少 6 位'}
              autoComplete={isLogin ? 'current-password' : 'new-password'}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-coffee-700 px-6 py-2.5 text-sm font-medium text-cream-50 shadow-sm transition-all hover:bg-coffee-800 hover:shadow-md disabled:opacity-50"
          >
            {loading ? '处理中...' : isLogin ? '登录' : '注册'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-400">
          {isLogin ? '还没有账号？' : '已有账号？'}
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="ml-1 text-coffee-700 hover:underline"
          >
            {isLogin ? '去注册' : '去登录'}
          </button>
        </p>
      </div>
    </div>
  )
}
