/**
 * 按 IP 的滑动窗口速率限制器（Durable Object）。
 * 每个 IP 一个 DO 实例（idFromName(ip)），实例内维护最近一分钟的时间戳，
 * 超过 limit 则返回 429。实例休眠时内存清空 = 限流窗口重置，对本场景可接受。
 */
export class RateLimiter implements DurableObject {
  private hits: number[] = []

  constructor(_state: DurableObjectState) {}

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)
    const limit = Number(url.searchParams.get('limit') ?? 20)
    const windowMs = 60_000
    const now = Date.now()

    this.hits = this.hits.filter((t) => now - t < windowMs)
    if (this.hits.length >= limit) {
      return new Response(null, {
        status: 429,
        headers: { 'Retry-After': '60' },
      })
    }
    this.hits.push(now)
    return new Response(null, { status: 200 })
  }
}
