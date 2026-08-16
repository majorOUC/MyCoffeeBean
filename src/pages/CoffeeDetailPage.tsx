import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import CoffeeCover from '@/components/CoffeeCover'
import EmptyState from '@/components/EmptyState'
import RatingStars from '@/components/RatingStars'
import Tag from '@/components/Tag'
import { BREW_LABEL, PROCESS_LABEL, ROAST_LABEL } from '@/data/constants'
import { coffeeService } from '@/services/coffeeService'
import type { Coffee, Tasting } from '@/types/coffee'
import { countryFlag, formatDate, formatAltitude } from '@/utils/format'

export default function CoffeeDetailPage() {
  const { id } = useParams<{ id: string }>()
  // key 让 id 变化时整组件重挂载，避免复用旧数据闪屏
  return <CoffeeDetail key={id ?? ''} id={id ?? ''} />
}

function CoffeeDetail({ id }: { id: string }) {
  const navigate = useNavigate()
  const [coffee, setCoffee] = useState<Coffee | null | undefined>(undefined)
  const [tastings, setTastings] = useState<Tasting[]>([])

  useEffect(() => {
    if (!id) return
    void (async () => {
      const [c, t] = await Promise.all([
        coffeeService.getCoffee(id),
        coffeeService.listTastings(id),
      ])
      setCoffee(c ?? null)
      setTastings(t)
    })()
  }, [id])

  if (coffee === undefined) {
    return (
      <div className="py-16">
        <div className="h-72 animate-pulse rounded-3xl bg-coffee-100/60" />
      </div>
    )
  }

  if (coffee === null) {
    return (
      <div className="py-16">
        <EmptyState
          emoji="🫥"
          title="找不到这款咖啡豆"
          description="它可能已被删除，或者链接有误。"
        />
        <div className="mt-6 text-center">
          <Link
            to="/coffees"
            className="text-sm text-coffee-700 hover:underline"
          >
            ← 返回图鉴
          </Link>
        </div>
      </div>
    )
  }

  const handleDelete = async () => {
    if (!window.confirm(`确定删除「${coffee.name}」及其全部冲煮记录？`)) return
    await coffeeService.deleteCoffee(coffee.id)
    navigate('/coffees')
  }

  return (
    <div className="py-8">
      <Link
        to="/coffees"
        className="text-sm text-ink-400 transition-colors hover:text-coffee-700"
      >
        ← 返回图鉴
      </Link>

      {/* 档案头部 */}
      <div className="mt-4 flex flex-col gap-6 sm:flex-row">
        <div className="h-56 w-full shrink-0 overflow-hidden rounded-3xl shadow-md sm:h-64 sm:w-72">
          <CoffeeCover coffee={coffee} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="font-display text-3xl font-bold text-coffee-900">
                {coffee.name}
              </h1>
              <p className="mt-1 text-ink-400">{coffee.roaster}</p>
            </div>
            <div className="flex gap-2">
              <Link
                to={`/add?id=${coffee.id}`}
                className="rounded-full border border-coffee-300 px-4 py-1.5 text-sm text-coffee-700 transition-colors hover:bg-coffee-100"
              >
                编辑
              </Link>
              <button
                type="button"
                onClick={() => void handleDelete()}
                className="rounded-full border border-red-200 px-4 py-1.5 text-sm text-red-600 transition-colors hover:bg-red-50"
              >
                删除
              </button>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <RatingStars value={coffee.rating} size="lg" />
            <span className="font-display text-2xl font-semibold text-coffee-800">
              {coffee.rating.toFixed(1)}
            </span>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
            <Field
              label="国家"
              value={`${countryFlag(coffee.country)} ${coffee.country}`}
            />
            <Field label="产区" value={coffee.region} />
            <Field label="庄园" value={coffee.farm} />
            <Field label="品种" value={coffee.variety} />
            <Field label="处理法" value={PROCESS_LABEL[coffee.process]} />
            <Field label="海拔" value={formatAltitude(coffee.altitude)} />
            <Field label="烘焙度" value={ROAST_LABEL[coffee.roastLevel]} />
            <Field label="收录于" value={formatDate(coffee.createdAt)} />
          </div>
        </div>
      </div>

      {/* 风味 */}
      <section className="mt-10">
        <h2 className="mb-3 font-display text-lg font-semibold text-coffee-800">
          风味图谱
        </h2>
        <div className="flex flex-wrap gap-2">
          {coffee.flavorNotes.length > 0 ? (
            coffee.flavorNotes.map((note) => (
              <Tag key={note} tone="leaf">
                {note}
              </Tag>
            ))
          ) : (
            <span className="text-sm text-ink-400">尚未记录风味</span>
          )}
        </div>
      </section>

      {/* 我的笔记 */}
      {coffee.description && (
        <section className="mt-8">
          <h2 className="mb-3 font-display text-lg font-semibold text-coffee-800">
            我的笔记
          </h2>
          <blockquote className="rounded-2xl border-l-4 border-coffee-400 bg-cream-50 p-5 text-ink-700 italic shadow-sm">
            {coffee.description}
          </blockquote>
        </section>
      )}

      {/* 冲煮记录 */}
      <section className="mt-10">
        <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-coffee-800">
          喝豆记录
          <span className="rounded-full bg-coffee-100 px-2 py-0.5 text-xs font-medium text-coffee-600">
            {tastings.length}
          </span>
        </h2>

        {tastings.length === 0 ? (
          <EmptyState
            emoji="🫖"
            title="还没有冲煮记录"
            description="同一款豆子可以记录多次不同的冲煮（V60 / 爱乐压 / 意式…）。"
          />
        ) : (
          <ol className="relative space-y-4 border-l-2 border-coffee-200 pl-6">
            {tastings.map((t) => (
              <li key={t.id} className="relative">
                <span
                  aria-hidden
                  className="absolute top-5 -left-[31px] h-3 w-3 rounded-full border-2 border-cream-100 bg-coffee-500"
                />
                <div className="rounded-2xl border border-coffee-200/70 bg-cream-50 p-5 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-display font-semibold text-coffee-800">
                        {BREW_LABEL[t.brewMethod] ?? t.brewMethod}
                      </span>
                      <span className="text-sm text-ink-400">{t.date}</span>
                    </div>
                    <RatingStars value={t.rating} size="sm" />
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-ink-500">
                    <Param
                      label="粉量"
                      value={t.dose ? `${t.dose} g` : undefined}
                    />
                    <Param
                      label="水量"
                      value={t.water ? `${t.water} g` : undefined}
                    />
                    <Param
                      label="水温"
                      value={t.temperature ? `${t.temperature} °C` : undefined}
                    />
                    <Param label="研磨" value={t.grindSize} />
                    <Param label="时间" value={t.brewTime} />
                  </div>

                  {t.notes && (
                    <p className="mt-3 border-t border-coffee-200/60 pt-3 text-sm text-ink-500">
                      {t.notes}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  )
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <dt className="text-xs tracking-wide text-ink-400">{label}</dt>
      <dd className="mt-0.5 font-medium text-ink-900">{value || '—'}</dd>
    </div>
  )
}

function Param({ label, value }: { label: string; value?: string }) {
  if (!value) return null
  return (
    <span className="rounded-full bg-coffee-100 px-2.5 py-1">
      {label} {value}
    </span>
  )
}
