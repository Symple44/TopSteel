import { performance } from 'node:perf_hooks'
import { Injectable, type NestMiddleware } from '@nestjs/common'
import type { NextFunction, Request, Response } from 'express'
import type { OutgoingHttpHeaders } from 'node:http'

interface ExtendedRequest extends Request {
  startTime?: number
  requestId?: string
}

@Injectable()
export class EnhancedMiddleware implements NestMiddleware {
  use(req: ExtendedRequest, res: Response, next: NextFunction) {
    const start = performance.now()

    req.startTime = start
    req.requestId = this.generateRequestId()

    res.setHeader('X-Request-ID', req.requestId)

    // Intercepter writeHead pour ajouter le header de temps de réponse avant l'envoi
    const originalWriteHead = res.writeHead.bind(res)
    res.writeHead = function (statusCode: number, ...args: any[]) {
      const duration = performance.now() - start
      res.setHeader('X-Response-Time', `${duration.toFixed(2)}ms`)
      return originalWriteHead.call(this, statusCode, ...args)
    }

    res.on('finish', () => {
      const duration = performance.now() - start
      if (duration > 1000) {
        // Log des requêtes lentes
      }
    })

    next()
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}
