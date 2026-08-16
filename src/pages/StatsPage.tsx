import EmptyState from '@/components/EmptyState'
import ErrorState from '@/components/ErrorState'
import { PROCESS_LABEL, ROAST_LABEL } from '@/data/constants'
import { useAsync } from '@/hooks/useAsync'
import { coffeeService } from '@/services/coffeeService'
import type { AtlasStats } from '@/types/coffee'
import { countryFlag } from '@/utils/format'

export default function StatsPage() {
  const {
    data: stats,
    error,
    retry,
  } = useAsync<AtlasStats>(() => coffeeService.getStats())

  if (error) {
    return (
      <div className="py-16">
        <ErrorState onRetry={retry} />
      </div>
    )
  }

  if (stats === null) {
    return (
      <div className="space-y-6 py-8">
        <div className="h-10 w-56 animate-pulse rounded-xl bg-coffee-100/60" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-2xl bg-coffee-100/60"
            />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-3xl bg-coffee-100/60" />
      </div>
    )
  }

  if (stats.totalCoffees === 0) {
    return (
      <div className="py-16">
        <h1 className="mb-8 text-center font-display text-3xl font-bold text-coffee-900">
          统计
        </h1>
        <EmptyState
          emoji="📊"
          title="还没有数据"
          description="记录几款咖啡豆后，这里会呈现你的口味地图。"
        />
      </div>
    )
  }

  return (
    <div className="py-8">
      <header>
        <h1 className="font-display text-3xl font-bold text-coffee-900">
          统计
        </h1>
        <p className="mt-1 text-sm text-ink-400">你的咖啡口味数据画像</p>
      </header>

      {/* 概览 */}
      <section className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
        <StatCard emoji="☕" label="咖啡豆" value={stats.totalCoffees} />
        <StatCard emoji="🌍" label="国家" value={stats.totalCountries} />
        <StatCard emoji="🏔️" label="产区" value={stats.totalRegions} />
        <StatCard emoji="🫖" label="冲煮次数" value={stats.totalTastings} />
        <StatCard
          emoji="⭐"
          label="平均评分"
          value={stats.averageRating}
          suffix=" / 5"
        />
      </section>

      {/* 月度饮用 */}
      <section className="mt-10 rounded-3xl border border-coffee-200/70 bg-cream-50 p-5 shadow-sm sm:p-6">
        <h2 className="font-display text-lg font-semibold text-coffee-800">
          月度饮用数量
        </h2>
        {stats.monthlyTastings.length === 0 ? (
          <p className="mt-4 text-sm text-ink-400">还没有饮用记录。</p>
        ) : (
          <div className="mt-5 flex h-40 items-end gap-3 overflow-x-auto pb-1">
            {stats.monthlyTastings.map((m) => {
              const max = Math.max(...stats.monthlyTastings.map((x) => x.count))
              return (
                <div
                  key={m.label}
                  className="flex min-w-14 flex-1 flex-col items-center gap-2"
                >
                  <span className="text-xs font-semibold text-coffee-700">
                    {m.count}
                  </span>
                  <div
                    className="w-full max-w-12 rounded-t-lg bg-coffee-500 transition-all hover:bg-coffee-700"
                    style={{
                      height: `${Math.max(8, (m.count / max) * 110)}px`,
                    }}
                    title={`${m.label}：${m.count} 次`}
                  />
                  <span className="text-[10px] whitespace-nowrap text-ink-400">
                    {m.label.slice(2)}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* 分布 */}
      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <DistCard title="国家分布" emoji="🌍">
          {stats.countryDist.map((d) => (
            <DistBar
              key={d.label}
              label={`${countryFlag(d.label)} ${d.label}`}
              value={d.count}
              max={stats.countryDist[0]?.count ?? 1}
              tone="coffee"
            />
          ))}
        </DistCard>

        <DistCard title="处理法分布" emoji="🧪">
          {stats.processDist.map((d) => (
            <DistBar
              key={d.label}
              label={
                PROCESS_LABEL[d.label as keyof typeof PROCESS_LABEL] ?? d.label
              }
              value={d.count}
              max={stats.processDist[0]?.count ?? 1}
              tone="leaf"
            />
          ))}
        </DistCard>

        <DistCard title="烘焙度分布" emoji="🔥">
          {stats.roastDist.map((d) => (
            <DistBar
              key={d.label}
              label={
                ROAST_LABEL[d.label as keyof typeof ROAST_LABEL] ?? d.label
              }
              value={d.count}
              max={stats.roastDist[0]?.count ?? 1}
              tone="coffee"
            />
          ))}
        </DistCard>

        <DistCard title="评分分布" emoji="⭐">
          {stats.ratingDist.map((d) => (
            <DistBar
              key={d.label}
              label={`${d.label} ★`}
              value={d.count}
              max={stats.ratingDist[0]?.count ?? 1}
              tone="leaf"
            />
          ))}
        </DistCard>
      </div>
    </div>
  )
}

function StatCard({
  emoji,
  label,
  value,
  suffix = '',
}: {
  emoji: string
  label: string
  value: number
  suffix?: string
}) {
  return (
    <div className="rounded-2xl border border-coffee-200/70 bg-cream-50 px-4 py-5 text-center shadow-sm">
      <div className="font-display text-2xl font-semibold text-coffee-800">
        {value}
        <span className="text-sm text-ink-400">{suffix}</span>
      </div>
      <div className="mt-1 text-xs text-ink-400">
        <span aria-hidden className="mr-1">
          {emoji}
        </span>
        {label}
      </div>
    </div>
  )
}

function DistCard({
  title,
  emoji,
  children,
}: {
  title: string
  emoji: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-3xl border border-coffee-200/70 bg-cream-50 p-5 shadow-sm sm:p-6">
      <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-coffee-800">
        <span aria-hidden>{emoji}</span>
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

function DistBar({
  label,
  value,
  max,
  tone,
}: {
  label: string
  value: number
  max: number
  tone: 'coffee' | 'leaf'
}) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-28 shrink-0 truncate text-ink-700">{label}</span>
      <div className="h-5 flex-1 overflow-hidden rounded-full bg-coffee-100/70">
        <div
          className={`h-full rounded-full transition-all ${
            tone === 'coffee' ? 'bg-coffee-500' : 'bg-leaf-400'
          }`}
          style={{ width: `${Math.max(4, (value / max) * 100)}%` }}
        />
      </div>
      <span className="w-8 text-right font-medium text-ink-500">{value}</span>
    </div>
  )
}
