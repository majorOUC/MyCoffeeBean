import type { ReactNode } from 'react'

type TagTone = 'default' | 'leaf' | 'coffee' | 'outline'

const TONE_CLASS: Record<TagTone, string> = {
  default: 'bg-coffee-100 text-coffee-700',
  leaf: 'bg-leaf-300/30 text-leaf-700',
  coffee: 'bg-coffee-700 text-cream-50',
  outline: 'border border-coffee-300 text-coffee-700',
}

interface TagProps {
  children: ReactNode
  tone?: TagTone
  onClick?: () => void
  active?: boolean
}

/** 小圆角标签：风味、处理法、筛选 chip 等 */
export default function Tag({
  children,
  tone = 'default',
  onClick,
  active,
}: TagProps) {
  const clickable = onClick !== undefined
  const activeTone: TagTone = active ? 'coffee' : tone

  return (
    <span
      onClick={onClick}
      role={clickable ? 'button' : undefined}
      aria-pressed={clickable ? (active ?? false) : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') onClick()
            }
          : undefined
      }
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium tracking-wide transition-colors ${TONE_CLASS[activeTone]} ${
        clickable ? 'cursor-pointer select-none hover:brightness-95' : ''
      }`}
    >
      {children}
    </span>
  )
}
