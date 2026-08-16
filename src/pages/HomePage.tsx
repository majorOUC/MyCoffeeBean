import { Link } from 'react-router-dom'

const plannedPages = [
  {
    to: '/coffees',
    emoji: '📖',
    title: '咖啡豆图鉴',
    desc: '卡片式收藏墙 · 搜索与筛选（Phase 1）',
  },
  {
    to: '/coffees/1',
    emoji: '🗂️',
    title: '咖啡豆档案',
    desc: '产地 / 品种 / 处理法 / 风味与冲煮记录（Phase 1）',
  },
  {
    to: '/add',
    emoji: '✍️',
    title: '记录一款豆子',
    desc: '完整信息录入表单（Phase 1）',
  },
  {
    to: '/stats',
    emoji: '📊',
    title: '统计',
    desc: '国家 / 处理法 / 评分分布（Phase 6）',
  },
  {
    to: '/map',
    emoji: '🌍',
    title: '咖啡产地地图',
    desc: 'Country → Region → Coffees（Phase 5）',
  },
]

export default function HomePage() {
  return (
    <div className="py-8 sm:py-14">
      <section className="text-center">
        <p className="mb-3 text-sm font-medium uppercase tracking-[0.3em] text-coffee-500">
          My Personal Coffee Index
        </p>
        <h1 className="font-display text-4xl font-bold text-coffee-900 sm:text-5xl">
          Coffee Atlas
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-ink-500">
          我的个人咖啡豆图鉴 —— 记录喝过的每一款豆子、每一次冲煮，
          以及它们背后的产地故事。
        </p>
      </section>

      <section className="mx-auto mt-12 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: '咖啡豆', value: '—' },
          { label: '国家', value: '—' },
          { label: '产区', value: '—' },
          { label: '处理法', value: '—' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-coffee-200/70 bg-cream-50 px-4 py-5 text-center shadow-sm"
          >
            <div className="font-display text-2xl font-semibold text-coffee-800">
              {stat.value}
            </div>
            <div className="mt-1 text-xs tracking-wide text-ink-400">
              {stat.label}
            </div>
          </div>
        ))}
      </section>

      <section className="mt-14">
        <h2 className="mb-4 text-center text-sm font-medium uppercase tracking-[0.25em] text-ink-400">
          站点地图 · 待建设
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plannedPages.map((page) => (
            <Link
              key={page.title}
              to={page.to}
              className="group rounded-2xl border border-coffee-200/70 bg-cream-50 p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-coffee-400 hover:shadow-md"
            >
              <span className="text-2xl" aria-hidden>
                {page.emoji}
              </span>
              <h3 className="mt-3 font-display text-lg font-semibold text-coffee-800">
                {page.title}
              </h3>
              <p className="mt-1 text-sm text-ink-400">{page.desc}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
