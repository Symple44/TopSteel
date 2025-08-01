import { performance } from 'node:perf_hooks'
import { Injectable, type NestMiddleware } from '@nestjs/common'
import { NextFunction, Response } from 'express'
import type { Request } from 'express'

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
    res.setHeader('X-Response-Time', '0ms')

    res.on('finish', () => {
      const duration = performance.now() - start
      res.setHeader('X-Response-Time', `${duration.toFixed(2)}ms`)

      if (duration > 1000) {
      }
    })

    next()
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}
