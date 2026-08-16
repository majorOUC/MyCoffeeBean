import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import CoffeeCover from '@/components/CoffeeCover'
import ErrorState from '@/components/ErrorState'
import RatingStars from '@/components/RatingStars'
import { PROCESS_LABEL } from '@/data/constants'
import { useAsync } from '@/hooks/useAsync'
import { coffeeService } from '@/services/coffeeService'
import type { AtlasStats, Coffee, Tasting } from '@/types/coffee'
import { countryFlag, timeAgo } from '@/utils/format'

interface HomeData {
  stats: AtlasStats
  recent: Coffee[]
  top: Coffee | null
  recentTastings: Tasting[]
}

export default function HomePage() {
  const { data, error, retry } = useAsync<HomeData>(async () => {
    const [stats, recentList, topList, recentTastings] = await Promise.all([
      coffeeService.getStats(),
      coffeeService.listCoffees({ sort: 'recent' }),
      coffeeService.listCoffees({ sort: 'rating' }),
      coffeeService.listRecentTastings(4),
    ])
    return {
      stats,
      recent: recentList.slice(0, 3),
      top: topList[0] ?? null,
      recentTastings,
    }
  })

  if (error) {
    return (
      <div className="py-16">
        <ErrorState onRetry={retry} />
      </div>
    )
  }

  const stats = data?.stats
  const recent = data?.recent ?? []
  const top = data?.top ?? null
  const recentTastings = data?.recentTastings ?? null

  return (
    <div className="py-8 sm:py-12">
      {/* Hero */}
      <section className="text-center">
        <p className="mb-3 text-sm font-medium tracking-[0.3em] text-coffee-500 uppercase">
          My Personal Coffee Index
        </p>
        <h1 className="font-display text-4xl font-bold text-coffee-900 sm:text-5xl">
          Coffee Atlas
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-ink-500">
          我的个人咖啡豆图鉴 —— 记录喝过的每一款豆子、每一次冲煮，
          以及它们背后的产地故事。
        </p>
        <Link
          to="/add"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-coffee-700 px-6 py-2.5 text-sm font-medium text-cream-50 shadow-sm transition-all hover:bg-coffee-800 hover:shadow-md"
        >
          <span aria-hidden>✍️</span> 记一款豆子
        </Link>
      </section>

      {/* 统计 */}
      <section className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="咖啡豆" value={stats?.totalCoffees} emoji="☕" />
        <StatCard label="国家" value={stats?.totalCountries} emoji="🌍" />
        <StatCard label="产区" value={stats?.totalRegions} emoji="🏔️" />
        <StatCard label="处理法" value={stats?.totalProcesses} emoji="🧪" />
      </section>

      {/* 最高评分 */}
      {top && (
        <section className="mt-12">
          <SectionTitle emoji="🏆" title="最高评分" />
          <div className="flex flex-col gap-5 rounded-3xl border border-coffee-200/70 bg-cream-50 p-5 shadow-sm sm:flex-row sm:items-center sm:p-6">
            <div className="h-40 w-full overflow-hidden rounded-2xl sm:h-32 sm:w-48">
              <CoffeeCover coffee={top} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-3">
                <h3 className="font-display text-xl font-semibold text-coffee-900">
                  {top.name}
                </h3>
                <RatingStars value={top.rating} size="sm" />
              </div>
              <p className="mt-1 text-sm text-ink-400">
                {top.roaster} · {top.country} {top.region}
              </p>
              {top.description && (
                <p className="mt-2 line-clamp-2 text-sm text-ink-500">
                  {top.description}
                </p>
              )}
              <Link
                to={`/coffees/${top.id}`}
                className="mt-3 inline-block text-sm font-medium text-coffee-700 underline-offset-4 hover:underline"
              >
                查看档案 →
              </Link>
            </div>
          </div>
        </section>
      )}

      <div className="mt-12 grid gap-10 lg:grid-cols-2">
        {/* 最近添加 */}
        <section>
          <SectionTitle emoji="🆕" title="最近添加" />
          <div className="space-y-3">
            {recent.map((coffee) => (
              <MiniRow
                key={coffee.id}
                coffee={coffee}
                meta={timeAgo(coffee.createdAt)}
              />
            ))}
            {recent.length === 0 && <LoadingRow />}
          </div>
        </section>

        {/* 最近饮用 */}
        <section>
          <SectionTitle emoji="🫖" title="最近饮用" />
          <div className="space-y-3">
            {recentTastings === null && <LoadingRow />}
            {recentTastings?.map((t) => (
              <TastingRow key={t.id} tasting={t} />
            ))}
            {recentTastings?.length === 0 && (
              <div className="rounded-2xl border border-dashed border-coffee-300/60 p-4 text-center text-sm text-ink-400">
                还没有饮用记录，去详情页记录一次冲煮吧
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  emoji,
}: {
  label: string
  value?: number
  emoji: string
}) {
  return (
    <div className="rounded-2xl border border-coffee-200/70 bg-cream-50 px-4 py-5 text-center shadow-sm transition-transform hover:-translate-y-0.5">
      <div className="font-display text-3xl font-semibold text-coffee-800">
        {value ?? '—'}
      </div>
      <div className="mt-1 text-xs tracking-wide text-ink-400">
        <span aria-hidden className="mr-1">
          {emoji}
        </span>
        {label}
      </div>
    </div>
  )
}

function SectionTitle({ emoji, title }: { emoji: string; title: string }) {
  return (
    <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-coffee-800">
      <span aria-hidden>{emoji}</span>
      {title}
    </h2>
  )
}

function MiniRow({ coffee, meta }: { coffee: Coffee; meta: string }) {
  return (
    <Link
      to={`/coffees/${coffee.id}`}
      className="flex items-center gap-4 rounded-2xl border border-coffee-200/60 bg-cream-50 p-3 transition-colors hover:border-coffee-400"
    >
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl">
        <CoffeeCover coffee={coffee} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium text-coffee-900">
          {coffee.name}
        </div>
        <div className="truncate text-sm text-ink-400">
          <span aria-hidden className="mr-1">
            {countryFlag(coffee.country)}
          </span>
          {coffee.country} · {PROCESS_LABEL[coffee.process]}
        </div>
      </div>
      <span className="shrink-0 text-xs text-ink-400">{meta}</span>
    </Link>
  )
}

function TastingRow({ tasting }: { tasting: Tasting }) {
  const [coffee, setCoffee] = useState<Coffee | null>(null)
  useEffect(() => {
    void coffeeService
      .getCoffee(tasting.coffeeId)
      .then((c) => setCoffee(c ?? null))
  }, [tasting.coffeeId])

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-coffee-200/60 bg-cream-50 p-3">
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl">
        {coffee && <CoffeeCover coffee={coffee} />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium text-coffee-900">
          {coffee?.name ?? '…'}
        </div>
        <div className="truncate text-sm text-ink-400">
          {tasting.brewMethod} · {tasting.date}
          {tasting.notes ? ` · ${tasting.notes}` : ''}
        </div>
      </div>
      <span className="shrink-0 text-xs font-semibold text-coffee-700">
        {tasting.rating.toFixed(1)} ★
      </span>
    </div>
  )
}

function LoadingRow() {
  return (
    <div className="rounded-2xl border border-dashed border-coffee-300/60 p-4 text-center text-sm text-ink-400">
      加载中…
    </div>
  )
}
