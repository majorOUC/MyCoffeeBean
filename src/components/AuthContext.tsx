import {
  createContext,
  useCallback,
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
