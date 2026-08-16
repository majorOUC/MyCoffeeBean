import { useCallback, useRef, useState, type ReactNode } from 'react'

import { ToastContext, type ToastTone } from '@/components/toastContext'

interface ToastItem {
  id: number
  tone: ToastTone
  message: string
}

/** 轻量 toast：成功 / 失败反馈，自动消失 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const nextId = useRef(0)

  const show = useCallback((message: string, tone: ToastTone = 'info') => {
    const id = ++nextId.current
    setItems((list) => [...list, { id, tone, message }])
    setTimeout(() => {
      setItems((list) => list.filter((t) => t.id !== id))
    }, 3000)
  }, [])

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex flex-col items-center gap-2 px-4">
        {items.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`animate-fade-slide rounded-full px-5 py-2.5 text-sm font-medium shadow-lg ${
              t.tone === 'success'
                ? 'bg-leaf-600 text-cream-50'
                : t.tone === 'error'
                  ? 'bg-red-600 text-white'
                  : 'bg-coffee-700 text-cream-50'
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
