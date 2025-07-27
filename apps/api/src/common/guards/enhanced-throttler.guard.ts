// apps/api/src/common/guards/enhanced-throttler.guard.ts
import { Injectable, ExecutionContext } from '@nestjs/common'
import { ThrottlerGuard, ThrottlerException } from '@nestjs/throttler'
import { Request } from 'express'

@Injectable()
export class EnhancedThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Request): Promise<string> {
    // Utiliser l'ID utilisateur si disponible, sinon l'IP
    const user = (req as any).user
    if (user?.id) {
      return `user:${user.id}`
    }
    
    // Récupérer la vraie IP même derrière un proxy
    const forwarded = req.headers['x-forwarded-for']
    const realIp = typeof forwarded === 'string' ? forwarded.split(',')[0] : req.connection.remoteAddress
    
    return `ip:${realIp || req.ip}`
  }

  protected async throwThrottlingException(context: ExecutionContext): Promise<void> {
    const request = context.switchToHttp().getRequest<Request>()
    const tracker = await this.getTracker(request)
    
    // Log des tentatives de dépassement
    console.warn(`Rate limit exceeded for ${tracker} on ${request.method} ${request.url}`)
    
    throw new ThrottlerException('Trop de requêtes. Veuillez patienter avant de réessayer.')
  }

  protected getSkipConditions(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>()
    
    // Conditions pour ignorer le throttling
    const skipConditions = [
      // Health checks
      request.url?.includes('/health'),
      // Métriques
      request.url?.includes('/metrics'),
      // Webhooks (avec validation appropriée)
      request.url?.includes('/webhook') && this.isValidWebhook(request),
      // Admin avec IP autorisée
      request.url?.includes('/admin') && this.isAdminIP(request)
    ]
    
    return skipConditions.some(condition => condition === true)
  }

  private isValidWebhook(request: Request): boolean {
    // Validation simple - à améliorer selon vos besoins
    const validHeaders = request.headers['x-webhook-signature'] || request.headers['authorization']
    return !!validHeaders
  }

  private isAdminIP(request: Request): boolean {
    // IPs autorisées pour l'admin (à configurer via env)
    const adminIPs = process.env.ADMIN_IPS?.split(',') || []
    const clientIP = this.getClientIP(request)
    return adminIPs.includes(clientIP)
  }

  private getClientIP(request: Request): string {
    const forwarded = request.headers['x-forwarded-for']
    return typeof forwarded === 'string' ? forwarded.split(',')[0] : (request.connection?.remoteAddress || request.ip || 'unknown')
  }
}