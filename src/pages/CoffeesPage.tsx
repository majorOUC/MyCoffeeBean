import { useMemo, useState } from 'react'

import CoffeeCard from '@/components/CoffeeCard'
import EmptyState from '@/components/EmptyState'
import ErrorState from '@/components/ErrorState'
import {
  PROCESSES,
  PROCESS_LABEL,
  ROAST_LABEL,
  ROAST_LEVELS,
} from '@/data/constants'
import { useAsync } from '@/hooks/useAsync'
import { coffeeService } from '@/services/coffeeService'

type SortOption = 'recent' | 'rating' | 'name' | 'price'

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'recent', label: '最近添加' },
  { value: 'rating', label: '评分最高' },
  { value: 'name', label: '名称' },
  { value: 'price', label: '克价最低' },
]

export default function CoffeesPage() {
  const { data, loading, error, retry } = useAsync(() =>
    coffeeService.listCoffees(),
  )

  const [search, setSearch] = useState('')
  const [country, setCountry] = useState('')
  const [process, setProcess] = useState('')
  const [roastLevel, setRoastLevel] = useState('')
  const [sort, setSort] = useState<SortOption>('recent')

  const allCoffees = useMemo(() => data ?? [], [data])
  const loaded = !loading && !error

  const countries = useMemo(
    () => [...new Set(allCoffees.map((c) => c.country))].sort(),
    [allCoffees],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return allCoffees
      .filter((c) => {
        if (country && c.country !== country) return false
        if (process && c.process !== process) return false
        if (roastLevel && c.roastLevel !== roastLevel) return false
        if (q) {
          const hay = [
            c.name,
            c.roaster,
            c.country,
            c.region,
            c.farm ?? '',
            c.variety ?? '',
            ...c.flavorNotes,
          ]
            .join(' ')
            .toLowerCase()
          if (!hay.includes(q)) return false
        }
        return true
      })
      .sort((a, b) => {
        switch (sort) {
          case 'rating':
            return b.rating - a.rating
          case 'name':
            return a.name.localeCompare(b.name)
          case 'price':
            // 有克价的排前面，没有的排后面；有克价的按升序排列
            if (a.pricePerGram == null && b.pricePerGram == null) return 0
            if (a.pricePerGram == null) return 1
            if (b.pricePerGram == null) return -1
            return a.pricePerGram - b.pricePerGram
          default:
            return (
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )
        }
      })
  }, [allCoffees, search, country, process, roastLevel, sort])

  const hasFilter = Boolean(search || country || process || roastLevel)

  return (
    <div className="py-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold text-coffee-900">
            咖啡豆图鉴
          </h1>
          <p className="mt-1 text-sm text-ink-400">
            共收录 {allCoffees.length} 款 · 当前显示 {filtered.length} 款
          </p>
        </div>
      </header>

      {/* 工具栏 */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <label className="col-span-2 relative sm:col-span-3 lg:col-span-1">
          <span className="sr-only">搜索</span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索名称 / 烘焙商 / 风味…"
            className="w-full rounded-full border border-coffee-300/70 bg-cream-50 px-4 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-coffee-500 focus:ring-2 focus:ring-coffee-300/40 focus:outline-none"
          />
        </label>

        <Select
          label="国家"
          value={country}
          onChange={setCountry}
          options={countries.map((c) => ({ value: c, label: c }))}
          allLabel="全部国家"
        />
        <Select
          label="处理法"
          value={process}
          onChange={setProcess}
          options={PROCESSES.map((p) => ({
            value: p,
            label: PROCESS_LABEL[p],
          }))}
          allLabel="全部处理法"
        />
        <Select
          label="烘焙度"
          value={roastLevel}
          onChange={setRoastLevel}
          options={ROAST_LEVELS.map((r) => ({
            value: r,
            label: ROAST_LABEL[r],
          }))}
          allLabel="全部烘焙度"
        />
        <Select
          label="排序"
          value={sort}
          onChange={(v) => setSort(v as SortOption)}
          options={SORT_OPTIONS.map((s) => ({
            value: s.value,
            label: s.label,
          }))}
        />
      </div>

      {/* 卡片墙 */}
      <div className="mt-8">
        {error ? (
          <ErrorState onRetry={retry} />
        ) : !loaded ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-80 animate-pulse rounded-3xl bg-coffee-100/60"
              />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((coffee) => (
              <CoffeeCard key={coffee.id} coffee={coffee} />
            ))}
          </div>
        ) : hasFilter ? (
          <EmptyState
            emoji="🔍"
            title="没有匹配的咖啡豆"
            description="换个关键词或放宽筛选条件试试。"
          />
        ) : (
          <EmptyState
            emoji="☕"
            title="图鉴还是空的"
            description="记录你的第一款咖啡豆，开始构建你的咖啡地图吧。"
          />
        )}
      </div>
    </div>
  )
}

function Select({
  label,
  value,
  onChange,
  options,
  allLabel,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  allLabel?: string
}) {
  return (
    <label>
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full cursor-pointer rounded-full border border-coffee-300/70 bg-cream-50 py-2 pl-4 pr-10 text-sm text-ink-900 focus:border-coffee-500 focus:ring-2 focus:ring-coffee-300/40 focus:outline-none"
      >
        {allLabel && <option value="">{allLabel}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}
