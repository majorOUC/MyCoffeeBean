interface EmptyStateProps {
  emoji?: string
  title: string
  description?: string
}

/** 空状态占位（无搜索结果 / 无数据） */
export default function EmptyState({
  emoji = '🔍',
  title,
  description,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-coffee-300/70 bg-cream-50/60 px-6 py-16 text-center">
      <span className="text-4xl" aria-hidden>
        {emoji}
      </span>
      <h3 className="mt-4 font-display text-lg font-semibold text-coffee-800">
        {title}
      </h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-ink-400">{description}</p>
      )}
    </div>
  )
}
