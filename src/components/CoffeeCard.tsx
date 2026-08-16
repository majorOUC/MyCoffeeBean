import { Link } from 'react-router-dom'

import CoffeeCover from '@/components/CoffeeCover'
import RatingStars from '@/components/RatingStars'
import { PROCESS_LABEL, ROAST_LABEL } from '@/data/constants'
import type { Coffee } from '@/types/coffee'
import { countryFlag } from '@/utils/format'

/** 图鉴墙中的单张咖啡豆卡片 */
export default function CoffeeCard({ coffee }: { coffee: Coffee }) {
  return (
    <Link
      to={`/coffees/${coffee.id}`}
      className="group overflow-hidden rounded-3xl border border-coffee-200/70 bg-cream-50 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-coffee-400 hover:shadow-lg"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <div className="h-full w-full transition-transform duration-300 group-hover:scale-105">
          <CoffeeCover coffee={coffee} />
        </div>
        <span className="absolute top-3 right-3 rounded-full bg-cream-50/90 px-2.5 py-1 text-xs font-semibold text-coffee-800 backdrop-blur">
          {coffee.rating.toFixed(1)} ★
        </span>
      </div>

      <div className="p-4 sm:p-5">
        <h3 className="font-display text-lg leading-snug font-semibold text-coffee-900 group-hover:text-coffee-700">
          {coffee.name}
        </h3>
        <p className="mt-0.5 text-sm text-ink-400">{coffee.roaster}</p>

        <p className="mt-2 flex items-center gap-1.5 text-sm text-ink-500">
          <span aria-hidden>{countryFlag(coffee.country)}</span>
          {coffee.country} · {coffee.region}
        </p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="inline-flex items-center rounded-full bg-leaf-300/30 px-2.5 py-1 text-xs font-medium text-leaf-700">
            {PROCESS_LABEL[coffee.process]}
          </span>
          <span className="inline-flex items-center rounded-full bg-coffee-100 px-2.5 py-1 text-xs font-medium text-coffee-700">
            {ROAST_LABEL[coffee.roastLevel]}
          </span>
        </div>

        <div className="mt-3 border-t border-coffee-200/60 pt-3">
          <RatingStars value={coffee.rating} size="sm" />
        </div>
      </div>
    </Link>
  )
}
