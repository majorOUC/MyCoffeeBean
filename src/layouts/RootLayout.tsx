import { NavLink, Outlet } from 'react-router-dom'

const navItems = [
  { to: '/', label: '首页' },
  { to: '/coffees', label: '图鉴' },
  { to: '/add', label: '记录' },
  { to: '/stats', label: '统计' },
  { to: '/map', label: '地图' },
]

export default function RootLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-coffee-200/60 bg-cream-50/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <NavLink to="/" className="flex items-center gap-2">
            <span aria-hidden className="text-xl text-coffee-700">
              ☕
            </span>
            <span className="font-display text-lg font-semibold tracking-wide text-coffee-800">
              Coffee Atlas
            </span>
          </NavLink>

          <nav className="flex items-center gap-1 sm:gap-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-full px-3 py-1.5 text-sm transition-colors ${
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
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <Outlet />
      </main>

      <footer className="border-t border-coffee-200/60 bg-cream-50">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-ink-400 sm:flex-row sm:px-6">
          <span>Coffee Atlas · 个人咖啡豆图鉴</span>
          <span>Phase 0 · 项目初始化</span>
        </div>
      </footer>
    </div>
  )
}
