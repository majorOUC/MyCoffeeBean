import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'

import { useAuth } from '@/components/AuthContext'

const navItems = [
  { to: '/', label: '首页' },
  { to: '/coffees', label: '图鉴' },
  { to: '/add', label: '记录', requireAdmin: true },
  { to: '/stats', label: '统计' },
  { to: '/map', label: '地图' },
]

const THEME_KEY = 'coffee-atlas:theme'

export default function RootLayout() {
  const location = useLocation()
  const { user, logout } = useAuth()
  const [dark, setDark] = useState(() =>
    document.documentElement.classList.contains('dark'),
  )

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    try {
      localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light')
    } catch {
      // 隐私模式下忽略
    }
  }, [dark])

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-coffee-200/60 bg-cream-50/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-2 px-4 sm:px-6">
          <NavLink to="/" className="flex shrink-0 items-center gap-2">
            <span aria-hidden className="text-xl text-coffee-700">
              ☕
            </span>
            <span className="font-display text-lg font-semibold tracking-wide text-coffee-800">
              Coffee Atlas
            </span>
          </NavLink>

          <div className="flex min-w-0 items-center gap-1 sm:gap-2">
            <nav className="flex items-center gap-0.5 overflow-x-auto sm:gap-2">
              {navItems
                .filter((item) => !item.requireAdmin || user?.role === 'admin')
                .map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `shrink-0 rounded-full px-2.5 py-1.5 text-sm transition-colors sm:px-3 ${
                        isActive
                          ? 'bg-coffee-700 text-cream-50'
                          : 'text-ink-500 hover:bg-coffee-100 hover:text-coffee-800'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
            </nav>
            <button
              type="button"
              onClick={() => setDark((d) => !d)}
              aria-label={dark ? '切换到浅色模式' : '切换到深色模式'}
              className="ml-1 shrink-0 rounded-full px-2 py-1.5 text-base leading-none transition-colors hover:bg-coffee-100"
            >
              <span aria-hidden>{dark ? '☀️' : '🌙'}</span>
            </button>
            {user ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-ink-500">
                  {user.username}
                  {user.role === 'admin' && (
                    <span className="ml-1 rounded-full bg-coffee-200 px-1.5 py-0.5 text-xs text-coffee-700">
                      管理员
                    </span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={logout}
                  className="rounded-full px-2.5 py-1.5 text-sm text-ink-500 transition-colors hover:bg-coffee-100 hover:text-coffee-800"
                >
                  退出
                </button>
              </div>
            ) : (
              <NavLink
                to="/login"
                className="rounded-full px-2.5 py-1.5 text-sm text-ink-500 transition-colors hover:bg-coffee-100 hover:text-coffee-800"
              >
                登录
              </NavLink>
            )}
          </div>
        </div>
      </header>

      <main
        key={location.pathname}
        className="mx-auto w-full max-w-6xl flex-1 animate-fade-slide px-4 py-8 sm:px-6"
      >
        <Outlet />
      </main>

      <footer className="border-t border-coffee-200/60 bg-cream-50">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-ink-400 sm:flex-row sm:px-6">
          <span>Coffee Atlas · 个人咖啡豆图鉴</span>
          <a
            href="https://github.com/majorOUC/MyCoffeeBean"
            target="_blank"
            rel="noreferrer"
            className="hover:text-coffee-700"
          >
            GitHub
          </a>
        </div>
      </footer>
    </div>
  )
}
