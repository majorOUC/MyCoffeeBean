import { clampRating } from '@/utils/format'

interface RatingStarsProps {
  value: number
  size?: 'sm' | 'md' | 'lg'
  /** 交互模式：允许点击设置评分 */
  onChange?: (value: number) => void
}

const SIZE_CLASS = {
  sm: 'text-sm',
  md: 'text-xl',
  lg: 'text-3xl',
} as const

/** 满星/半星/空星字符渲染，支持只读展示与点击评分 */
export default function RatingStars({
  value,
  size = 'md',
  onChange,
}: RatingStarsProps) {
  const rating = clampRating(value)
  const full = Math.floor(rating)
  const half = rating - full >= 0.5

  return (
    <div
      className={`inline-flex items-center gap-0.5 ${SIZE_CLASS[size]}`}
      role={onChange ? 'radiogroup' : undefined}
      aria-label={onChange ? '评分' : `评分 ${rating} / 5`}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= full || (star === full + 1 && half)
        return (
          <span
            key={star}
            aria-hidden={onChange ? undefined : true}
            className={
              onChange
                ? 'cursor-pointer transition-transform hover:scale-125'
                : undefined
            }
            onClick={onChange ? () => onChange(clampRating(star)) : undefined}
          >
            {filled ? '★' : '☆'}
          </span>
        )
      })}
    </div>
  )
}
