import { countryCover, countryFlag } from '@/utils/format'
import { resolveImageUrl } from '@/utils/url'
import type { Coffee } from '@/types/coffee'

interface CoffeeCoverProps {
  coffee: Pick<Coffee, 'country' | 'name' | 'imageUrl'>
  className?: string
}

/**
 * 咖啡豆封面：有照片用照片，否则按产地渲染渐变 + 国旗占位。
 * Phase 4 接入 R2 真实图片后自动优先展示照片。
 */
export default function CoffeeCover({
  coffee,
  className = '',
}: CoffeeCoverProps) {
  const imageUrl = resolveImageUrl(coffee.imageUrl)
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={`${coffee.name} 包装`}
        className={`h-full w-full object-cover ${className}`}
        loading="lazy"
      />
    )
  }

  return (
    <div
      aria-hidden
      className={`relative flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br ${countryCover(coffee.country)} ${className}`}
    >
      <span className="text-4xl drop-shadow-sm sm:text-5xl">
        {countryFlag(coffee.country)}
      </span>
      <span className="font-display text-sm font-semibold tracking-[0.2em] text-ink-700/70 uppercase">
        {coffee.country}
      </span>
    </div>
  )
}
