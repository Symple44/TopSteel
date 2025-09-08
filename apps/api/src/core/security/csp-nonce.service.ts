import { randomBytes } from 'node:crypto'
import { Injectable, Logger } from '@nestjs/common'

export interface NonceMetadata {
  nonce: string
  timestamp: number
  requestId?: string
}

@Injectable()
export class CSPNonceService {
  private readonly logger = new Logger(CSPNonceService.name)
  private readonly nonceCache = new Map<string, NonceMetadata>()
  private readonly NONCE_TTL = 5 * 60 * 1000 // 5 minutes
  private readonly CLEANUP_INTERVAL = 60 * 1000 // 1 minute

  constructor() {
    // Start cleanup interval
    setInterval(() => this.cleanupExpiredNonces(), this.CLEANUP_INTERVAL)
  }

  /**
   * Generate a cryptographically secure nonce for CSP
   */
  generateNonce(requestId?: string): string {
    const nonce = randomBytes(16).toString('base64')
    const metadata: NonceMetadata = {
      nonce,
      timestamp: Date.now(),
      requestId,
    }

    this.nonceCache.set(nonce, metadata)

    // Log nonce generation in development only
    if (process.env.NODE_ENV === 'development') {
      this.logger.debug(
        `Generated CSP nonce: ${nonce.substring(0, 8)}... for request ${requestId || 'unknown'}`
      )
    }

    return nonce
  }

  /**
   * Validate if a nonce is still valid
   */
  isNonceValid(nonce: string): boolean {
    const metadata = this.nonceCache.get(nonce)
    if (!metadata) {
      return false
    }

    const isExpired = Date.now() - metadata.timestamp > this.NONCE_TTL
    if (isExpired) {
      this.nonceCache.delete(nonce)
      return false
    }

    return true
  }

  /**
   * Get nonce metadata
   */
  getNonceMetadata(nonce: string): NonceMetadata | null {
    const metadata = this.nonceCache.get(nonce)
    if (!metadata || !this.isNonceValid(nonce)) {
      return null
    }
    return metadata
  }

  /**
   * Cleanup expired nonces from cache
   */
  private cleanupExpiredNonces(): void {
    const now = Date.now()
    let cleanedCount = 0

    for (const [nonce, metadata] of this.nonceCache.entries()) {
      if (now - metadata.timestamp > this.NONCE_TTL) {
        this.nonceCache.delete(nonce)
        cleanedCount++
      }
    }

    if (cleanedCount > 0 && process.env.NODE_ENV === 'development') {
      this.logger.debug(`Cleaned up ${cleanedCount} expired CSP nonces`)
    }
  }

  /**
   * Get current cache statistics
   */
  getCacheStats(): { total: number; expired: number } {
    const now = Date.now()
    let expired = 0

    for (const metadata of this.nonceCache.values()) {
      if (now - metadata.timestamp > this.NONCE_TTL) {
        expired++
      }
    }

    return {
      total: this.nonceCache.size,
      expired,
    }
  }

  /**
   * Clear all nonces (useful for testing)
   */
  clearCache(): void {
    this.nonceCache.clear()
    this.logger.debug('CSP nonce cache cleared')
  }
}
