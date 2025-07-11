// apps/web/src/lib/cache.ts
class CacheManager {
  private cache = new Map<string, { data: unknown; timestamp: number; ttl: number }>()

  set(key: string, data: unknown, ttl = 5 * 60 * 1000) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    })
  }

  get(key: string) {
    const item = this.cache.get(key)

    if (!item) return null

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key)

      return null
    }

    return item.data
  }

  invalidate(pattern?: string) {
    if (!pattern) {
      this.cache.clear()

      return
    }

    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key)
      }
    }
  }
}

export const cache = new CacheManager()
