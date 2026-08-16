import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import CoffeeCard from '@/components/CoffeeCard'
import EmptyState from '@/components/EmptyState'
import ErrorState from '@/components/ErrorState'
import RatingStars from '@/components/RatingStars'
import { useAsync } from '@/hooks/useAsync'
import { coffeeService } from '@/services/coffeeService'
import type { Coffee } from '@/types/coffee'
import { countryFlag } from '@/utils/format'
import WorldMap from '@/components/WorldMap'

export default function MapPage() {
  const {
    data: coffees,
    error,
    retry,
  } = useAsync(() => coffeeService.listCoffees())
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null)
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null)

  const counts = useMemo(() => {
    const map: Record<string, number> = {}
    for (const c of coffees ?? []) {
      map[c.country] = (map[c.country] ?? 0) + 1
    }
    return map
  }, [coffees])

  const countryRanking = useMemo(
    () =>
      Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .map(([country, count]) => ({ country, count })),
    [counts],
  )

  const countryCoffees = useMemo(
    () => coffees?.filter((c) => c.country === selectedCountry) ?? [],
    [coffees, selectedCountry],
  )

  const regions = useMemo(() => {
    const map = new Map<string, Coffee[]>()
    for (const c of countryCoffees) {
      const list = map.get(c.region) ?? []
      list.push(c)
      map.set(c.region, list)
    }
    return [...map.entries()].sort((a, b) => b[1].length - a[1].length)
  }, [countryCoffees])

  const regionCoffees = selectedRegion
    ? countryCoffees.filter((c) => c.region === selectedRegion)
    : []

  if (error) {
    return (
      <div className="py-16">
        <ErrorState onRetry={retry} />
      </div>
    )
  }

  return (
    <div className="py-8">
      <header>
        <h1 className="font-display text-3xl font-bold text-coffee-900">
          咖啡产地地图
        </h1>
        <p className="mt-1 text-sm text-ink-400">
          深色区域是你喝过的产地 · 点击国家查看产区与豆子
        </p>
      </header>

      {/* 地图 */}
      <div className="mt-6 overflow-hidden rounded-3xl border border-coffee-200/70 bg-cream-50 p-4 shadow-sm sm:p-6">
        {coffees == null ? (
          <div className="h-64 animate-pulse rounded-2xl bg-coffee-100/60 sm:h-96" />
        ) : (
          <WorldMap
            counts={counts}
            selected={selectedCountry ?? undefined}
            onSelect={(c) => {
              setSelectedCountry(c)
              setSelectedRegion(null)
            }}
          />
        )}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-5">
        {/* 左：国家榜 / 产区列表 */}
        <section className="lg:col-span-2">
          {!selectedCountry ? (
            <>
              <h2 className="mb-3 font-display text-lg font-semibold text-coffee-800">
                产地足迹 · {countryRanking.length} 国
              </h2>
              {coffees != null && countryRanking.length === 0 ? (
                <EmptyState
                  emoji="🌍"
                  title="地图还是空白的"
                  description="记录第一款咖啡豆，点亮你的第一块产地。"
                />
              ) : (
                <ul className="space-y-2">
                  {countryRanking.map(({ country, count }, i) => (
                    <li key={country}>
                      <button
                        type="button"
                        onClick={() => setSelectedCountry(country)}
                        className="flex w-full items-center gap-3 rounded-2xl border border-coffee-200/60 bg-cream-50 px-4 py-3 text-left transition-colors hover:border-coffee-400"
                      >
                        <span className="w-6 text-sm font-semibold text-ink-400">
                          {i + 1}
                        </span>
                        <span aria-hidden className="text-xl">
                          {countryFlag(country)}
                        </span>
                        <span className="flex-1 font-medium text-coffee-900">
                          {country}
                        </span>
                        <span className="text-sm text-ink-400">{count} 款</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-coffee-800">
                  <span aria-hidden>{countryFlag(selectedCountry)}</span>
                  {selectedCountry}
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCountry(null)
                    setSelectedRegion(null)
                  }}
                  className="text-sm text-ink-400 transition-colors hover:text-coffee-700"
                >
                  ← 返回全部
                </button>
              </div>
              <ul className="space-y-2">
                {regions.map(([region, list]) => (
                  <li key={region}>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedRegion(
                          selectedRegion === region ? null : region,
                        )
                      }
                      className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors ${
                        selectedRegion === region
                          ? 'border-coffee-500 bg-coffee-100'
                          : 'border-coffee-200/60 bg-cream-50 hover:border-coffee-400'
                      }`}
                    >
                      <span className="flex-1 font-medium text-coffee-900">
                        {region || '未记录产区'}
                      </span>
                      <span className="text-sm text-ink-400">
                        {list.length} 款
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        {/* 右：豆子列表 */}
        <section className="lg:col-span-3">
          <h2 className="mb-3 font-display text-lg font-semibold text-coffee-800">
            {selectedRegion
              ? `${selectedCountry} · ${selectedRegion}`
              : selectedCountry
                ? `${selectedCountry} 的全部豆子`
                : '评分精选'}
          </h2>
          {!selectedCountry ? (
            <ul className="space-y-2">
              {(coffees ?? [])
                .slice()
                .sort((a, b) => b.rating - a.rating)
                .slice(0, 5)
                .map((c) => (
                  <li key={c.id}>
                    <Link
                      to={`/coffees/${c.id}`}
                      className="flex items-center gap-4 rounded-2xl border border-coffee-200/60 bg-cream-50 p-3 transition-colors hover:border-coffee-400"
                    >
                      <span aria-hidden className="text-xl">
                        {countryFlag(c.country)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium text-coffee-900">
                          {c.name}
                        </span>
                        <span className="block truncate text-sm text-ink-400">
                          {c.country} · {c.region}
                        </span>
                      </span>
                      <RatingStars value={c.rating} size="sm" />
                    </Link>
                  </li>
                ))}
            </ul>
          ) : (selectedRegion ? regionCoffees : countryCoffees).length === 0 ? (
            <EmptyState emoji="🫥" title="该产地还没有豆子" />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2">
              {(selectedRegion ? regionCoffees : countryCoffees).map((c) => (
                <CoffeeCard key={c.id} coffee={c} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
