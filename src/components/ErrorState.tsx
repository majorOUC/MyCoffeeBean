interface ErrorStateProps {
  title?: string
  description?: string
  onRetry?: () => void
}

/** 加载失败状态（网络错误 / 服务不可用） */
export default function ErrorState({
  title = '加载失败',
  description = '网络或服务暂时不可用，请稍后重试。',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-red-200/70 bg-cream-50 px-6 py-16 text-center dark:border-red-900/50">
      <span className="text-4xl" aria-hidden>
        ⚠️
      </span>
      <h3 className="mt-4 font-display text-lg font-semibold text-coffee-800">
        {title}
      </h3>
      <p className="mt-1 max-w-sm text-sm text-ink-400">{description}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 rounded-full bg-coffee-700 px-5 py-2 text-sm font-medium text-cream-50 transition-colors hover:bg-coffee-800"
        >
          重试
        </button>
      )}
    </div>
  )
}
