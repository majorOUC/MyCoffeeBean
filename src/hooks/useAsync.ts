import { useCallback, useEffect, useRef, useState } from 'react'

interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: boolean
}

/** 简单的异步数据加载状态（loading / error / retry），fn 变化不会自动重跑 */
export function useAsync<T>(fn: () => Promise<T>) {
  const fnRef = useRef(fn)

  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: true,
    error: false,
  })
  const [nonce, setNonce] = useState(0)

  // 保持 fn 引用最新（在 effect 中写 ref，避免渲染期访问）
  useEffect(() => {
    fnRef.current = fn
  }, [fn])

  useEffect(() => {
    let alive = true
    fnRef.current().then(
      (data) => {
        if (alive) setState({ data, loading: false, error: false })
      },
      () => {
        if (alive) setState({ data: null, loading: false, error: true })
      },
    )
    return () => {
      alive = false
    }
  }, [nonce])

  const retry = useCallback(() => {
    setState({ data: null, loading: true, error: false })
    setNonce((n) => n + 1)
  }, [])

  return { ...state, retry }
}
