import * as crypto from 'node:crypto'
import { Injectable, Logger } from '@nestjs/common'
import type { ConfigService } from '@nestjs/config'

interface EdgeWorkerConfig {
  accountId: string
  apiToken: string
  scriptName: string
  kvNamespaceId: string
  durableObjectNamespaceId?: string
}

@Injectable()
export class EdgeWorkerService {
  private readonly logger = new Logger(EdgeWorkerService.name)
  private readonly config: EdgeWorkerConfig
  private readonly workerScript: string

  constructor(private configService: ConfigService) {
    this.config = {
      accountId: this.configService.get('CLOUDFLARE_ACCOUNT_ID') || '',
      apiToken: this.configService.get('CLOUDFLARE_API_TOKEN') || '',
      scriptName: this.configService.get('CLOUDFLARE_WORKER_SCRIPT_NAME') || 'marketplace-edge',
      kvNamespaceId: this.configService.get('CLOUDFLARE_KV_NAMESPACE_ID') || '',
      durableObjectNamespaceId: this.configService.get('CLOUDFLARE_DO_NAMESPACE_ID'),
    }

    this.workerScript = this.generateWorkerScript()
  }

  /**
   * Generate Cloudflare Worker script for edge caching
   */
  private generateWorkerScript(): string {
    return `
// Cloudflare Worker Script for TopSteel Marketplace
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

// Cache configuration
const CACHE_RULES = [
  { pattern: /\\/api\\/marketplace\\/products\\/\\d+$/, ttl: 300, edgeTTL: 3600 },
  { pattern: /\\/api\\/marketplace\\/categories/, ttl: 600, edgeTTL: 7200 },
  { pattern: /\\/api\\/marketplace\\/search/, ttl: 60, edgeTTL: 300 },
  { pattern: /\\/images\\//, ttl: 86400, edgeTTL: 604800 },
  { pattern: /\\.(?:css|js|woff2?)$/, ttl: 86400, edgeTTL: 604800 },
]

// Request handling
async function handleRequest(request) {
  const url = new URL(request.url)
  
  // Handle OPTIONS requests for CORS
  if (request.method === 'OPTIONS') {
    return handleOptions(request)
  }
  
  // Check if request should be cached
  const cacheRule = getCacheRule(url.pathname)
  
  if (!cacheRule || request.method !== 'GET') {
    return fetch(request)
  }
  
  // Generate cache key
  const cacheKey = generateCacheKey(request, cacheRule)
  const cache = caches.default
  
  // Check cache
  let response = await cache.match(cacheKey)
  
  if (!response) {
    // Cache miss - fetch from origin
    response = await fetch(request)
    
    // Clone response for caching
    if (response.status === 200) {
      const responseToCache = response.clone()
      
      // Add cache headers
      const headers = new Headers(responseToCache.headers)
      headers.set('Cache-Control', \`public, max-age=\${cacheRule.ttl}, s-maxage=\${cacheRule.edgeTTL}\`)
      headers.set('X-Cache', 'MISS')
      headers.set('X-Cache-Key', cacheKey.url)
      
      // Create new response with headers
      response = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers
      })
      
      // Store in cache
      event.waitUntil(cache.put(cacheKey, response.clone()))
    }
  } else {
    // Cache hit - add header
    const headers = new Headers(response.headers)
    headers.set('X-Cache', 'HIT')
    headers.set('X-Cache-Key', cacheKey.url)
    
    response = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: headers
    })
  }
  
  return response
}

// Generate cache key
function generateCacheKey(request, cacheRule) {
  const url = new URL(request.url)
  
  // Include query parameters for search/filter endpoints
  if (url.pathname.includes('search') || url.pathname.includes('filter')) {
    const sortedParams = Array.from(url.searchParams.entries()).sort()
    const paramsString = sortedParams.map(([k, v]) => \`\${k}=\${v}\`).join('&')
    return new Request(\`\${url.origin}\${url.pathname}?\${paramsString}\`, request)
  }
  
  // Default cache key
  return new Request(url.toString(), request)
}

// Get cache rule for path
function getCacheRule(pathname) {
  return CACHE_RULES.find(rule => rule.pattern.test(pathname))
}

// Handle CORS OPTIONS
function handleOptions(request) {
  const headers = request.headers
  
  if (
    headers.get('Origin') !== null &&
    headers.get('Access-Control-Request-Method') !== null &&
    headers.get('Access-Control-Request-Headers') !== null
  ) {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Headers': request.headers.get('Access-Control-Request-Headers'),
      }
    })
  }
  
  return new Response(null, {
    headers: {
      Allow: 'GET, HEAD, POST, OPTIONS'
    }
  })
}

// KV Storage operations
async function getFromKV(key) {
  try {
    const value = await MARKETPLACE_KV.get(key)
    return value ? JSON.parse(value) : null
  } catch (error) {
    console.error('KV get error:', error)
    return null
  }
}

async function putToKV(key, value, ttl = 3600) {
  try {
    await MARKETPLACE_KV.put(key, JSON.stringify(value), {
      expirationTtl: ttl
    })
    return true
  } catch (error) {
    console.error('KV put error:', error)
    return false
  }
}

// Rate limiting
async function checkRateLimit(ip) {
  const key = \`rate_limit:\${ip}\`
  const current = await getFromKV(key)
  
  if (!current) {
    await putToKV(key, { count: 1, timestamp: Date.now() }, 60)
    return true
  }
  
  if (current.count >= 100) {
    return false
  }
  
  current.count++
  await putToKV(key, current, 60)
  return true
}

// Geolocation-based routing
function getClosestOrigin(request) {
  const country = request.headers.get('CF-IPCountry')
  
  const origins = {
    'US': 'https://us.api.topsteel.com',
    'FR': 'https://eu.api.topsteel.com',
    'default': 'https://api.topsteel.com'
  }
  
  return origins[country] || origins.default
}
    `.trim()
  }

  /**
   * Deploy worker script to Cloudflare
   */
  async deployWorker(): Promise<boolean> {
    try {
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${this.config.accountId}/workers/scripts/${this.config.scriptName}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${this.config.apiToken}`,
            'Content-Type': 'application/javascript',
          },
          body: this.workerScript,
        }
      )

      const data = (await response.json()) as { success: boolean; errors?: unknown }

      if (!data.success) {
        this.logger.error(`Worker deployment failed: ${JSON.stringify(data.errors)}`)
        return false
      }

      this.logger.log(`Worker deployed successfully: ${this.config.scriptName}`)
      return true
    } catch (error) {
      this.logger.error('Error deploying worker:', error)
      return false
    }
  }

  /**
   * Create KV namespace for caching
   */
  async createKVNamespace(name: string): Promise<string | null> {
    try {
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${this.config.accountId}/storage/kv/namespaces`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.config.apiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ title: name }),
        }
      )

      const data = (await response.json()) as { success: boolean; errors?: unknown; result?: { id: string } }

      if (!data.success) {
        this.logger.error(`KV namespace creation failed: ${JSON.stringify(data.errors)}`)
        return null
      }

      this.logger.log(`KV namespace created: ${data.result?.id}`)
      return data.result?.id || null
    } catch (error) {
      this.logger.error('Error creating KV namespace:', error)
      return null
    }
  }

  /**
   * Store data in KV
   */
  async putKV(
    key: string,
    value: unknown,
    ttl?: number,
    metadata?: Record<string, unknown>
  ): Promise<boolean> {
    try {
      const body: any = {
        value: JSON.stringify(value),
        metadata,
      }

      if (ttl) {
        body.expiration_ttl = ttl
      }

      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${this.config.accountId}/storage/kv/namespaces/${this.config.kvNamespaceId}/values/${key}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${this.config.apiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        }
      )

      if (!response.ok) {
        this.logger.error(`KV put failed for key ${key}`)
        return false
      }

      return true
    } catch (error) {
      this.logger.error('Error storing in KV:', error)
      return false
    }
  }

  /**
   * Get data from KV
   */
  async getKV(key: string): Promise<any | null> {
    try {
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${this.config.accountId}/storage/kv/namespaces/${this.config.kvNamespaceId}/values/${key}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${this.config.apiToken}`,
          },
        }
      )

      if (!response.ok) {
        return null
      }

      const text = await response.text()
      return JSON.parse(text)
    } catch (error) {
      this.logger.error('Error getting from KV:', error)
      return null
    }
  }

  /**
   * Delete from KV
   */
  async deleteKV(key: string): Promise<boolean> {
    try {
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${this.config.accountId}/storage/kv/namespaces/${this.config.kvNamespaceId}/values/${key}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${this.config.apiToken}`,
          },
        }
      )

      return response.ok
    } catch (error) {
      this.logger.error('Error deleting from KV:', error)
      return false
    }
  }

  /**
   * Bulk write to KV
   */
  async bulkWriteKV(
    items: Array<{
      key: string
      value: any
      ttl?: number
      metadata?: Record<string, unknown>
    }>
  ): Promise<boolean> {
    try {
      const bulk = items.map((item) => ({
        key: item.key,
        value: JSON.stringify(item.value),
        expiration_ttl: item.ttl,
        metadata: item.metadata,
      }))

      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${this.config.accountId}/storage/kv/namespaces/${this.config.kvNamespaceId}/bulk`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${this.config.apiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(bulk),
        }
      )

      const data = (await response.json()) as { success: boolean; errors?: unknown }

      if (!data.success) {
        this.logger.error(`Bulk write failed: ${JSON.stringify(data.errors)}`)
        return false
      }

      return true
    } catch (error) {
      this.logger.error('Error in bulk write:', error)
      return false
    }
  }

  /**
   * List KV keys
   */
  async listKVKeys(
    prefix?: string,
    limit = 1000
  ): Promise<Array<{ name: string; metadata?: any }>> {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
      })

      if (prefix) {
        params.append('prefix', prefix)
      }

      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${this.config.accountId}/storage/kv/namespaces/${this.config.kvNamespaceId}/keys?${params}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${this.config.apiToken}`,
          },
        }
      )

      const data = (await response.json()) as { success: boolean; errors?: unknown; result?: { keys: Array<{ name: string; metadata?: any }> } }

      if (!data.success) {
        this.logger.error(`List keys failed: ${JSON.stringify(data.errors)}`)
        return []
      }

      return data.result?.keys || []
    } catch (error) {
      this.logger.error('Error listing KV keys:', error)
      return []
    }
  }

  /**
   * Generate cache key
   */
  generateCacheKey(path: string, params?: Record<string, unknown>, userId?: string): string {
    const parts = [path]

    if (params) {
      const sortedParams = Object.entries(params)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}=${v}`)
        .join('&')
      parts.push(sortedParams)
    }

    if (userId) {
      parts.push(`user:${userId}`)
    }

    const key = parts.join(':')
    return crypto.createHash('md5').update(key).digest('hex')
  }

  /**
   * Invalidate cache patterns
   */
  async invalidateCache(patterns: string[]): Promise<boolean> {
    try {
      const keys: string[] = []

      for (const pattern of patterns) {
        const matchingKeys = await this.listKVKeys(pattern)
        keys.push(...matchingKeys.map((k) => k.name))
      }

      if (keys.length === 0) {
        return true
      }

      // Delete in batches
      const batchSize = 100
      for (let i = 0; i < keys.length; i += batchSize) {
        const batch = keys.slice(i, i + batchSize)
        await Promise.all(batch.map((key) => this.deleteKV(key)))
      }

      this.logger.log(`Invalidated ${keys.length} cache entries`)
      return true
    } catch (error) {
      this.logger.error('Error invalidating cache:', error)
      return false
    }
  }

  /**
   * Warm up cache
   */
  async warmUpCache(
    endpoints: Array<{
      path: string
      params?: Record<string, unknown>
      data: any
      ttl?: number
    }>
  ): Promise<void> {
    const items = endpoints.map((endpoint) => ({
      key: this.generateCacheKey(endpoint.path, endpoint.params),
      value: endpoint.data,
      ttl: endpoint.ttl || 3600,
    }))

    await this.bulkWriteKV(items)
    this.logger.log(`Warmed up cache with ${items.length} entries`)
  }
}
