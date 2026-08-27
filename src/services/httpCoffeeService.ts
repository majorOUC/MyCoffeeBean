import type { CoffeeService } from '@/services/types'
import type {
  AtlasStats,
  BrewCard,
  BrewCardInput,
  Coffee,
  CoffeeInput,
  CoffeeQuery,
  Comment,
  CommentInput,
  DiaryEntry,
  DiaryInput,
} from '@/types/coffee'
import { compressImage } from '@/utils/image'

/** Worker API 基础地址，形如 http://localhost:8787（生产环境为同域，留空即可） */
export const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? ''

class HttpError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers)
  if (typeof init?.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  // 添加 auth token（如果存在）
  const token = localStorage.getItem('coffee-atlas:token')
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  const res = await fetch(`${API_BASE_URL}${path}`, { ...init, headers })
  if (!res.ok) {
    let message = `请求失败（${res.status}）`
    try {
      const body = (await res.json()) as { error?: string }
      if (body.error) message = body.error
    } catch {
      // 非 JSON 错误体，使用默认消息
    }
    throw new HttpError(res.status, message)
  }
  return (await res.json()) as T
}

function buildQuery(query: CoffeeQuery): string {
  const params = new URLSearchParams()
  if (query.search) params.set('search', query.search)
  if (query.country) params.set('country', query.country)
  if (query.process) params.set('process', query.process)
  if (query.roastLevel) params.set('roastLevel', query.roastLevel)
  if (query.sort) params.set('sort', query.sort)
  const s = params.toString()
  return s ? `?${s}` : ''
}

/** 真实实现：调用 Cloudflare Workers REST API */
class HttpCoffeeService implements CoffeeService {
  async listCoffees(query: CoffeeQuery = {}): Promise<Coffee[]> {
    return request<Coffee[]>(`/api/coffees${buildQuery(query)}`)
  }

  async getCoffee(id: string): Promise<Coffee | undefined> {
    try {
      return await request<Coffee>(`/api/coffees/${id}`)
    } catch (err) {
      if (err instanceof HttpError && err.status === 404) return undefined
      throw err
    }
  }

  async addCoffee(input: CoffeeInput): Promise<Coffee> {
    return request<Coffee>('/api/coffees', {
      method: 'POST',
      body: JSON.stringify(input),
    })
  }

  async updateCoffee(
    id: string,
    input: CoffeeInput,
  ): Promise<Coffee | undefined> {
    try {
      return await request<Coffee>(`/api/coffees/${id}`, {
        method: 'PUT',
        body: JSON.stringify(input),
      })
    } catch (err) {
      if (err instanceof HttpError && err.status === 404) return undefined
      throw err
    }
  }

  async deleteCoffee(id: string): Promise<boolean> {
    try {
      await request<{ ok: boolean }>(`/api/coffees/${id}`, { method: 'DELETE' })
      return true
    } catch (err) {
      if (err instanceof HttpError && err.status === 404) return false
      throw err
    }
  }

  async listComments(coffeeId: string): Promise<Comment[]> {
    return request<Comment[]>(`/api/coffees/${coffeeId}/comments`)
  }

  async addComment(coffeeId: string, input: CommentInput): Promise<Comment> {
    return request<Comment>(`/api/coffees/${coffeeId}/comments`, {
      method: 'POST',
      body: JSON.stringify(input),
    })
  }

  async deleteComment(commentId: string): Promise<boolean> {
    try {
      await request<{ ok: boolean }>(`/api/comments/${commentId}`, {
        method: 'DELETE',
      })
      return true
    } catch (err) {
      if (err instanceof HttpError && err.status === 404) return false
      throw err
    }
  }

  async getStats(): Promise<AtlasStats> {
    return request<AtlasStats>('/api/stats')
  }

  async uploadImage(file: File | Blob): Promise<string> {
    // 压缩后上传，减少 R2 存储与流量
    const blob = await compressImageToBlob(file)
    const form = new FormData()
    form.append('file', blob, 'coffee.jpg')
    const { url } = await request<{ key: string; url: string }>('/api/images', {
      method: 'POST',
      body: form,
    })
    return url
  }

  async listDiaryEntries(): Promise<DiaryEntry[]> {
    return request<DiaryEntry[]>('/api/diary')
  }

  async getDiaryEntry(id: string): Promise<DiaryEntry | undefined> {
    try {
      return await request<DiaryEntry>(`/api/diary/${id}`)
    } catch (err) {
      if (err instanceof HttpError && err.status === 404) return undefined
      throw err
    }
  }

  async addDiaryEntry(input: DiaryInput): Promise<DiaryEntry> {
    return request<DiaryEntry>('/api/diary', {
      method: 'POST',
      body: JSON.stringify(input),
    })
  }

  async updateDiaryEntry(
    id: string,
    input: DiaryInput,
  ): Promise<DiaryEntry | undefined> {
    try {
      return await request<DiaryEntry>(`/api/diary/${id}`, {
        method: 'PUT',
        body: JSON.stringify(input),
      })
    } catch (err) {
      if (err instanceof HttpError && err.status === 404) return undefined
      throw err
    }
  }

  async deleteDiaryEntry(id: string): Promise<boolean> {
    try {
      await request<{ ok: boolean }>(`/api/diary/${id}`, {
        method: 'DELETE',
      })
      return true
    } catch (err) {
      if (err instanceof HttpError && err.status === 404) return false
      throw err
    }
  }

  async getBrewCard(): Promise<BrewCard | null> {
    try {
      return await request<BrewCard | null>('/api/brew-card')
    } catch (err) {
      if (err instanceof HttpError && err.status === 404) return null
      throw err
    }
  }

  async saveBrewCard(input: BrewCardInput): Promise<BrewCard> {
    return request<BrewCard>('/api/brew-card', {
      method: 'PUT',
      body: JSON.stringify(input),
    })
  }
}

/** 把图片压缩为 JPEG Blob（上传 R2 用） */
async function compressImageToBlob(
  file: File | Blob,
  maxEdge = 1600,
  quality = 0.85,
): Promise<Blob> {
  const dataUrl = await compressImage(file, maxEdge, quality)
  const res = await fetch(dataUrl)
  return res.blob()
}

export const httpCoffeeService = new HttpCoffeeService()
