import type {
  AtlasStats,
  Coffee,
  CoffeeInput,
  CoffeeQuery,
  Comment,
  CommentInput,
} from '@/types/coffee'

/**
 * 数据服务契约。Mock 与 HTTP 两个实现共同遵守，
 * 页面只依赖此接口，切换数据源不改页面代码。
 */
export interface CoffeeService {
  listCoffees(query?: CoffeeQuery): Promise<Coffee[]>
  getCoffee(id: string): Promise<Coffee | undefined>
  addCoffee(input: CoffeeInput): Promise<Coffee>
  updateCoffee(id: string, input: CoffeeInput): Promise<Coffee | undefined>
  deleteCoffee(id: string): Promise<boolean>
  listComments(coffeeId: string): Promise<Comment[]>
  addComment(coffeeId: string, input: CommentInput): Promise<Comment>
  deleteComment(commentId: string): Promise<boolean>
  getStats(): Promise<AtlasStats>
  /** 上传图片，返回可存储的 imageUrl */
  uploadImage(file: File | Blob): Promise<string>
}
