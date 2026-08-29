import {
  createContext,
  useCallback,
  useEffect,
  useContext,
  useState,
  type ReactNode,
} from 'react'

import type { UserRole } from '@/types/coffee'

const TOKEN_KEY = 'coffee-atlas:token'
const USER_KEY = 'coffee-atlas:user'

export interface AuthUser {
  id: string
  username: string
  displayName: string
  role: UserRole
}

interface AuthState {
  user: AuthUser | null
  token: string | null
  loading: boolean
}

interface AuthContextType extends AuthState {
  login: (account: string, password: string) => Promise<void>
  register: (displayName: string, account: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => {
    try {
      const token = localStorage.getItem(TOKEN_KEY)
      const user = localStorage.getItem(USER_KEY)
      return {
        token,
        user: user ? JSON.parse(user) : null,
        loading: false,
      }
    } catch {
      return { token: null, user: null, loading: false }
    }
  })

  // 首次挂载时校验本地 token：过期/无效则清理登录态，
  // 有效则用服务端返回的最新用户信息刷新（角色变更/昵称变更同步）
  const [verifying, setVerifying] = useState(() =>
    Boolean(localStorage.getItem(TOKEN_KEY)),
  )

  useEffect(() => {
    if (!verifying) return
    let cancelled = false
    const token = localStorage.getItem(TOKEN_KEY)
    // 无 token（防御分支）与网络异常都不改变登录态，仅结束校验
    const check = token
      ? fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        })
      : Promise.reject(new Error('no token'))
    check
      .then(async (res) => {
        if (cancelled) return
        if (!res.ok) {
          // 401/404：token 失效或用户不存在，清理本地登录态
          localStorage.removeItem(TOKEN_KEY)
          localStorage.removeItem(USER_KEY)
          setState({ token: null, user: null, loading: false })
          return
        }
        const data = (await res.json()) as {
          user: AuthUser & { createdAt?: string }
        }
        const { createdAt: _createdAt, ...user } = data.user
        localStorage.setItem(USER_KEY, JSON.stringify(user))
        setState({ token, user, loading: false })
      })
      .catch(() => {
        // 网络异常：保留本地登录态，离线时仍可浏览
      })
      .finally(() => {
        if (!cancelled) setVerifying(false)
      })
    return () => {
      cancelled = true
    }
  }, [verifying])

  const login = useCallback(async (account: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: account, password }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || '登录失败')
    }
    const data = await res.json() as { token: string; user: AuthUser }
    localStorage.setItem(TOKEN_KEY, data.token)
    localStorage.setItem(USER_KEY, JSON.stringify(data.user))
    setState({ token: data.token, user: data.user, loading: false })
  }, [])

  const register = useCallback(async (displayName: string, account: string, password: string) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName, account, password }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || '注册失败')
    }
    const data = await res.json() as { token: string; user: AuthUser }
    localStorage.setItem(TOKEN_KEY, data.token)
    localStorage.setItem(USER_KEY, JSON.stringify(data.user))
    setState({ token: data.token, user: data.user, loading: false })
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setState({ token: null, user: null, loading: false })
  }, [])

  // 校验期间暂不渲染页面，避免守卫页对已登录用户闪现"权限不足"
  if (verifying) return null

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth 必须在 AuthProvider 内使用')
  return ctx
}
